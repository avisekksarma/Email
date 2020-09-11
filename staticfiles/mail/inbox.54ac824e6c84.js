let flash_div = document.querySelector('#flash')
document.addEventListener('DOMContentLoaded', function() {

  flash_div.style.display ='none';
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipient,subject,body,timestamp) {
  
  // Show compose view and hide other views
  flash_div.style.display='none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  // Clear out composition fields if the compose is not a reply redirect
  if (recipient === undefined || subject=== undefined || body === undefined || timestamp === undefined){
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  }else {
    document.querySelector('#compose-recipients').value = recipient;
    if (subject.indexOf('Re:') == -1){
      document.querySelector('#compose-subject').value = `Re: ${subject}`;
    }else{
      document.querySelector('#compose-subject').value = `${subject}`;
    }
    document.querySelector('#compose-body').value = `On ${timestamp}, ${recipient} wrote: \n ${body}`;
  }
  
  // adding an event listener to the submit button for sending email
  document.querySelector('#submit-button').addEventListener('click',send_email)
}
// loads a mailbox 
function load_mailbox(mailbox,is_email_sent = false) {

  if (!is_email_sent){
    flash_div.style.display='none';
  }
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  
  
  // Show the mailbox name
  let view = document.querySelector('#emails-view')
  view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  let user_email = document.querySelector('#user_email').firstElementChild.innerHTML
  
  //  fetching emails from api
  fetch(`/emails/${mailbox}`)
  .then(res => res.json())
  .then(emails => {
    let a_mail = '';
    emails.forEach(function(email){
      let determine_color;
      if (email.read === true){
        determine_color = 'mail_read'
        console.log('mail read')
      }else{
        determine_color = 'mail_unread'
        console.log('mail not read')
      }
      if(mailbox === 'inbox' || mailbox === 'archive'){
        a_mail += `<div class="${determine_color} border border-success rounded mb-3">
        
        <a class="link" href="#">
          <span class ="link" data-id="${email.id}" data-mailboxtype="${mailbox}"></span>
        </a>
        
        <p>
      <b>${email.sender}</b>
      <span style="float:right;">
        ${email.timestamp}
      </span>
      </p>
      <hr>
      <p>${email.subject}</p></div>`
      }
      else if (mailbox === 'sent'){
        a_mail += `<div class="${determine_color} border border-success rounded mb-3">
        
        <a class="link" href="#" data-id="${email.id}">
          <span class ="link" data-id="${email.id}" data-mailboxtype="${mailbox}"></span>
        </a>
        <p>
      <b>${email.recipients}</b>
      <span style="float:right;">
        ${email.timestamp}
      </span>
      <p>
      <hr>
      <p>${email.subject}</p></div>`
      }  
    })
    view.innerHTML += a_mail
  })
  .then(() => {
    // now making links working to show detail page of each email.
    document.querySelectorAll('span.link').forEach(link => {
      link.addEventListener('click',e => {
        fetch(`/emails/${e.target.dataset.id}`)
        .then(res => {
          console.log('res=>')
          console.log(res)
          if (!res.ok){
            throw new Error(`HTTP Error!! status: ${res.status}`)
          }else{
            return res.json();
          } 
        })
        .then(email_detail=>{
          email_detail_view(e.target.dataset.mailboxtype,email_detail)
        })
        .catch(e => {
          console.log(`An error occurred: ${e.name} with message = ${e.message}`)
        })
      })
    })
  })
  console.log('end of load mailbox function')
  // end of fetching email from api
}

function email_detail_view(mailbox_type,email_detail){
  
  flash_div.style.display='none';
  // Show the detail_view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';
  
  // show the detail of the email by creating and adding elements to the dom
  
  let email_detail_view_content = `<h3>${mailbox_type.toUpperCase()}-Detail-View</h3><hr>`
  email_detail_view_content += `
  <p><b>FROM: </b><span class ="email_detail_span">${email_detail.sender}</span></p>
  <p><b>TO: </b><span class ="email_detail_span">${email_detail.recipients}</span></p>
  <p><b>SUBJECT: </b><span class ="email_detail_span">${email_detail.subject}</span></p>
  <p><b>TIMESTAMP: </b><span class ="email_detail_span">${email_detail.timestamp}</span></p>
  <br>`
  
  if(mailbox_type === 'inbox'){
    email_detail_view_content += `<button id ="reply" class="btn btn-outline-info">REPLY</button>
      <button id = "archive-unarchive" class ="btn btn-outline-success" data-do="archive">Archive</button>
      <hr>
    <p>${email_detail.body}</p>  
    `
  }else if(mailbox_type === 'sent'){
    email_detail_view_content +=
    `<hr>
    <p>${email_detail.body}</p>  
    `
  }else{
    email_detail_view_content += `<button id = "archive-unarchive" class ="btn btn-outline-success" data-do="unarchive">Unarchive</button>
    <hr>
  <p>${email_detail.body}</p>`
  }
  
  document.querySelector('#email-detail-view').innerHTML = email_detail_view_content
  
  // changing unread email to read email
  if (mailbox_type === 'inbox'){
    fetch(`/emails/${email_detail.id}`,{
      method : 'PUT',
      body: JSON.stringify({
        read : true
      })
    }).catch(err => {
      console.log(`A error is caught with message: ${err.message}`)
    })
  }
  
  try{
    // adding eventlistener to reply button if we are in inbox-detail-view
    document.querySelector('button#reply').addEventListener('click',function(e){
      compose_email(email_detail.sender,email_detail.subject,email_detail.body,email_detail.timestamp)
    })
  }catch(err){
    // like pass of python so i left this code block empty
  }

  // adding eventlistener to archive-unarchive button if such button exists
  // that is like when we are in inbox-detail-view else catch error.
  try{
    document.querySelector('button#archive-unarchive').addEventListener('click',function(e){
      let archive;
      if (e.target.dataset.do === 'archive'){
        archive = true
      }else{
        archive= false
      }
      fetch(`/emails/${email_detail.id}`,{
        method: 'PUT',
        body: JSON.stringify({
          archived: archive
        })
      })
      .then(() => {
        load_mailbox('inbox')
      })
      .catch(e=> {
        console.log(`An error occured: ${e}`)
      })
    })
  }catch(err){
    // like pass of python so i left this code block empty
  }
}


function send_email(event){
  // event.preventDefault()
  console.log('clicked')
  let recipients = document.querySelector('#compose-recipients').value
  let subject = document.querySelector('#compose-subject').value
  let body = document.querySelector('#compose-body').value
  // document.querySelector('#compose-recipients').value = '';
  // document.querySelector('#compose-subject').value = '';
  // document.querySelector('#compose-body').value = '';
  
  console.log(document.querySelector('#submit-button'))
  document.querySelector('#submit-button').removeEventListener('click',send_email)
  // post by using fetch api
  fetch('/emails',{
    method : 'POST',
    body : JSON.stringify({
      recipients:recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => {
     console.log(response)
     if (!response.ok){  // not ok can happen if server resoonds a error for invalid sending i.e. http errors
      document.querySelector('#submit-button').addEventListener('click',send_email) 
      return response.json()
     }else{
       return response.json();
    } 
   })
  .then(result =>{
    if (result.error){
      alert(result.error)
      throw new Error(`Error occured: ${result.error}`)
    }
    console.log(result)
    flash_div.style.display='block';
    flash_div.innerHTML = 'Your Email was sent Successfully!!!'
    load_mailbox('sent',true)
    console.log('i exited sent')
  })  
  .catch(error=> {
    console.log(`Some problem occured during posting due to ${error.name} with message= ${error.message}`)

  })  
  
}