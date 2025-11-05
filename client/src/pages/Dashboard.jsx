import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', startTime: '', endTime: '' });
  const { socket } = useAuth();

  const load = async () => {
    const { data } = await window.api.get('/events');
    setEvents(data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('swap:update', handler);
    return () => socket.off('swap:update', handler);
  }, [socket]);

  const createEvent = async (e) => {
    e.preventDefault();
    await window.api.post('/events', form);
    setForm({ title: '', startTime: '', endTime: '' });
    await load();
  };

  const setStatus = async (id, status) => {
    await window.api.put(`/events/${id}`, { status });
    await load();
  };

  const deleteEvent = async (id) => {
    await window.api.delete(`/events/${id}`);
    await load();
  };

  return (
    <div className="page-container">
      <h1 className="page-title">My Events</h1>
      
      <div className="card mb-3">
        <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 600 }}>Create New Event</h3>
        <form onSubmit={createEvent} className="form">
          <div className="form-group">
            <input 
              className="form-input"
              placeholder="Event Title" 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input 
              className="form-input"
              type="datetime-local" 
              value={form.startTime} 
              onChange={(e) => setForm({ ...form, startTime: e.target.value })} 
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input 
              className="form-input"
              type="datetime-local" 
              value={form.endTime} 
              onChange={(e) => setForm({ ...form, endTime: e.target.value })} 
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Event</button>
        </form>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>No events yet. Create your first event above!</p>
        </div>
      ) : (
        <ul className="card-list">
          {events.map((ev) => (
            <li key={ev._id} className="card-item">
              <div className="event-title">{ev.title}</div>
              <div className="event-time">
                📅 {new Date(ev.startTime).toLocaleString()} - {new Date(ev.endTime).toLocaleString()}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span className={`status-badge status-${ev.status.toLowerCase().replace('_', '-')}`}>
                  {ev.status}
                </span>
              </div>
              <div className="event-actions">
                <button 
                  onClick={() => setStatus(ev._id, 'BUSY')} 
                  className="btn btn-secondary btn-sm"
                  disabled={ev.status === 'BUSY'}
                >
                  Set Busy
                </button>
                <button 
                  onClick={() => setStatus(ev._id, 'SWAPPABLE')} 
                  className="btn btn-outline btn-sm"
                  disabled={ev.status === 'SWAPPABLE'}
                >
                  Make Swappable
                </button>
                <button 
                  onClick={() => deleteEvent(ev._id)} 
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


