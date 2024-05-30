document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageInput = document.getElementById('message');
    const message = messageInput.value;
    if (message.trim()) {
      const chatbox = document.getElementById('chatbox');
      chatbox.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
      messageInput.value = '';
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });
        const data = await response.json();
        chatbox.innerHTML += `<div><strong>AI:</strong> ${data.choices[0].message['content']}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  });
  