import './App.css';
import PostalMime from 'postal-mime';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root');

function App() {
  const [email, setEmail] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);

  useEffect(() => {
    async function loadEmail() {
      const parser = new PostalMime();
      fetch('testEmail.txt')
        .then((r) => r.text())
        .then(async text => {
          const email = await parser.parse(text);
          console.log(email);
          setEmail(email);
        });
    }

    loadEmail();
  }, []);

  const handleReplyChange = (e) => {
    setReplyMessage(e.target.value);
  };

  const generateEmail = async (systemInstructions, userInput) => {
    const response = await fetch('https://rbs4kil7og.execute-api.us-east-1.amazonaws.com/prod/generateEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instructions: systemInstructions,
        user_input: userInput,
      }),
      // mode: 'no-cors'
    });


    if (response.error) {
      console.error('Failed to generate email');
      console.log('Response status:', response.status);
      return null;
    } else {
      console.log('Generated email:', response);
      return response.json();
    }
  };

  const sendEmail = async (replyMessage) => {
    const response = await fetch('https://0co5gsvzyf.execute-api.us-east-1.amazonaws.com/prod/sendmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: email.to[0].address,
        to: email.from.address,
        subject: `Re: ${email.subject}`,
        body: replyMessage,
      }),
    });

    console.log(response);
    if (!response.ok) {
      console.error('Failed to send email');
      console.log('Response status:', response.status);
    } else {
      console.log('Email sent successfully');
    }
  };

  const handleReply = async () => {
    console.log('Reply message:', replyMessage);
    await sendEmail(replyMessage);
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openSecondModal = () => {
    setIsSecondModalOpen(true);
  };

  const closeSecondModal = () => {
    setIsSecondModalOpen(false);
  };

  const [gptInstructions, setGptInstructions] = useState('');

  const handleGptInstructionsChange = (e) => {
    setGptInstructions(e.target.value);
  };

  return (
    <div className="App">
      <div className="email-content" style={{ textAlign: 'left' }}>
        {email ? (
          <div>
            <h2>{email.subject}</h2>
            <p>From: {email.from.address} {email.from.name} </p>
            <p>To: {email.to?.map(t => t.address).join(', ')}</p>
            <div dangerouslySetInnerHTML={{ __html: email.html || email.text }} />
            <button onClick={openModal} style={{ marginTop: '10px' }}>Open Reply Box</button>
            <button onClick={openSecondModal} style={{ marginTop: '10px', marginLeft: '10px' }}>Open GPTInstructions</button>
          </div>
        ) : (
          <p>Loading email...</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Reply Modal"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '50%',
          },
        }}
      >
        <h2>Reply</h2>
        <textarea
          value={replyMessage}
          onChange={handleReplyChange}
          placeholder="Type your reply here..."
          style={{ width: '100%', height: '100px', marginTop: '20px' }}
        />
        <button onClick={handleReply} style={{ marginTop: '10px' }}>Send Reply</button>
        <button 
          onClick={async () => {
            console.log("gptInstructions",gptInstructions);
            console.log("email.text", email.text);
            const generatedEmail = await generateEmail(gptInstructions, email.text);
            
            const replyEmail = await generatedEmail.body;
            console.log("replyEmail", replyEmail);
            const parsedReplyEmail = JSON.parse(replyEmail);
            if (parsedReplyEmail.error) {
              console.error('Failed to generate email');
              console.log('Response status:', parsedReplyEmail.status);
              return null;
            }
            setReplyMessage(parsedReplyEmail.body);

          }} 
          style={{ marginTop: '10px', marginLeft: '10px' }}
        >
          Generate Reply
        </button>
        <button onClick={closeModal} style={{ marginTop: '10px', marginLeft: '10px' }}>Close</button>
      </Modal>

      <Modal
        isOpen={isSecondModalOpen}
        onRequestClose={closeSecondModal}
        contentLabel="GPTInstructions"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '50%',
          },
        }}
      >
        <h2>GPTInstructions</h2>
        <textarea
          value={gptInstructions}
          onChange={handleGptInstructionsChange}
          placeholder="Type something here..."
          style={{ width: '100%', height: '100px', marginTop: '20px' }}
        />
        <button onClick={closeSecondModal} style={{ marginTop: '10px' }}>Close</button>
      </Modal>
    </div>
  );
}

export default App;
