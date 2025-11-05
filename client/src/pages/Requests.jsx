import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Requests() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const { socket } = useAuth();

  const load = async () => {
    const { data } = await window.api.get('/requests');
    setIncoming(data.incoming);
    setOutgoing(data.outgoing);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const reload = () => load();
    socket.on('swap:incoming', reload);
    socket.on('swap:update', reload);
    return () => {
      socket.off('swap:incoming', reload);
      socket.off('swap:update', reload);
    };
  }, [socket]);

  const respond = async (id, accepted) => {
    await window.api.post(`/swap-response/${id}`, { accepted });
    await load();
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Swap Requests</h1>
      
      <div className="grid-2">
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 600 }}>
            Incoming Requests
            {incoming.length > 0 && (
              <span className="status-badge status-pending" style={{ marginLeft: '8px' }}>
                {incoming.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </h3>
          {incoming.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📥</div>
              <p>No incoming requests</p>
            </div>
          ) : (
            <ul className="card-list">
              {incoming.map((r) => (
                <li key={r._id} className="card-item">
                  <div className="mb-2">
                    <div className="event-title">Their Slot: {r.theirSlot?.title}</div>
                    <div className="event-time">
                      📅 {r.theirSlot?.startTime && new Date(r.theirSlot.startTime).toLocaleString()} - {r.theirSlot?.endTime && new Date(r.theirSlot.endTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div><strong>Your Slot:</strong> {r.mySlot?.title}</div>
                    <div className="event-time">
                      📅 {r.mySlot?.startTime && new Date(r.mySlot.startTime).toLocaleString()} - {r.mySlot?.endTime && new Date(r.mySlot.endTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className={`status-badge status-${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="event-actions">
                      <button 
                        onClick={() => respond(r._id, true)} 
                        className="btn btn-success btn-sm"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => respond(r._id, false)} 
                        className="btn btn-danger btn-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 600 }}>
            Outgoing Requests
          </h3>
          {outgoing.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📤</div>
              <p>No outgoing requests</p>
            </div>
          ) : (
            <ul className="card-list">
              {outgoing.map((r) => (
                <li key={r._id} className="card-item">
                  <div className="mb-2">
                    <div className="event-title">Your Slot: {r.mySlot?.title}</div>
                    <div className="event-time">
                      📅 {r.mySlot?.startTime && new Date(r.mySlot.startTime).toLocaleString()} - {r.mySlot?.endTime && new Date(r.mySlot.endTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div><strong>Their Slot:</strong> {r.theirSlot?.title}</div>
                    <div className="event-time">
                      📅 {r.theirSlot?.startTime && new Date(r.theirSlot.startTime).toLocaleString()} - {r.theirSlot?.endTime && new Date(r.theirSlot.endTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong>From:</strong> {r.responder?.name || r.responder?.email}
                  </div>
                  <div>
                    <span className={`status-badge status-${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


