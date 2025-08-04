import React, { useEffect, useState } from 'react';

const WebSocketComponent = props => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/notifications/');

    socket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      setMessage(data.message);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <p>Message from WebSocket: {message}</p>
    </div>
  );
};

export default WebSocketComponent;
