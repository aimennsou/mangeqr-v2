import * as React from 'react';

interface EmailTemplateProps {
  name: string;
  email: string;
  message: string;
}

export default function EmailTemplate({
  name,
  email,
  message,
}: EmailTemplateProps) {
  return (
    <div>
      <h1>Nouveau message — MangeQR</h1>
      <div>De : {name}</div>
      <div>E-mail : {email}</div>
      <div>Message :</div>
      <div>{message}</div>
      <hr />
      <div>Ce message a été envoyé depuis un formulaire de contact MangeQR.</div>
    </div>
  );
}
