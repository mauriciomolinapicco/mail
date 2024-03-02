document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      emails.forEach((email) => {

        if (mailbox === 'sent') {
            const div = document.createElement('div');
            div.innerHTML = `to ${email.recipients} <b>${email.subject}</b> ${email.timestamp}`;
            //Distinguish read and unread emails
            if (email.read === true) {
              div.classList.add('readEmails');
            } else {
              div.classList.add('emails');
            }

            div.addEventListener('click', () => open_email(email.id));
            document.querySelector('#emails-view').appendChild(div);
        } else {
            const div = document.createElement('div');
            div.innerHTML = `From ${email.sender} <b>${email.subject}</b> ${email.timestamp}`;
            //Distinguish read and unread emails
            if (email.read === true) {
              div.classList.add('readEmails');
            } else {
              div.classList.add('emails');
            }

            div.addEventListener('click', () => open_email(email.id));
            document.querySelector('#emails-view').appendChild(div);          
        }
        
      });
  });
}

function send_email(event) {
  event.preventDefault();
  
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}

function open_email(email_id) {
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      let emailsView = document.querySelector('#emails-view');
      //Clean the view
      emailsView.innerHTML = '';
      emailsView.innerHTML += `<div><b>From:</b> ${email.sender}</div>`
      emailsView.innerHTML += `<div><b>To:</b> ${email.recipients}</div>`
      emailsView.innerHTML += `<div><b>Subject:</b> ${email.subject}</div><hr>`
      emailsView.innerHTML += `<p>${email.body}</p>`
      
      if (email.archived === false) {
        const archive_button = document.createElement('button');
        archive_button.innerHTML = 'Archive';
        archive_button.classList.add('btn-danger');
        archive_button.addEventListener('click', () => archive(email.id));
        emailsView.appendChild(archive_button);
      } else {
        const archive_button = document.createElement('button');
        archive_button.innerHTML = 'Unarchive';
        archive_button.classList.add('btn-danger');
        archive_button.addEventListener('click', () => unarchive(email.id));
        emailsView.appendChild(archive_button);
      }
      

      const reply_button = document.createElement('button');
      reply_button.innerHTML = 'Reply';
      reply_button.classList.add('btn-primary');
      reply_button.addEventListener('click', () => reply(email));
      emailsView.appendChild(reply_button);

      fetch(`/emails/${email_id}`,{
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
  });
}

function archive(email_id) {
  fetch(`/emails/${email_id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  load_mailbox('inbox');
}

function unarchive(email_id) {
  fetch(`/emails/${email_id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  load_mailbox('inbox');
}

function reply(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.slice(0,3) === 'Re:'){
    document.querySelector('#compose-subject').value = email.subject;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
  document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;

}