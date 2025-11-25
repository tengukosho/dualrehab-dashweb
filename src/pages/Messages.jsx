import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, MessageSquare, Trash2, User, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Messages() {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle pre-selected user from navigation (from Users page)
  useEffect(() => {
    if (location.state?.selectedUser && currentUser) {
      const user = location.state.selectedUser;
      
      // Create or find conversation with this user
      const existingConv = conversations.find(c => c.userId === user.id);
      
      if (existingConv) {
        handleSelectConversation(existingConv);
      } else {
        // Create new conversation object
        const newConv = {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          lastMessage: 'Start a new conversation',
          timestamp: new Date().toISOString(),
          unread: 0
        };
        setSelectedConversation(newConv);
        setMessages([]);
      }
    }
  }, [location.state, currentUser, conversations]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://192.168.2.2:3000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://192.168.2.2:3000/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      const convMap = {};
      data.messages.forEach(msg => {
        const otherId = msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
        const otherUser = msg.senderId === currentUser?.id ? msg.receiver : msg.sender;
        
        if (otherId === currentUser?.id) {
          return;
        }
        
        if (!convMap[otherId]) {
          convMap[otherId] = {
            userId: otherId,
            userName: otherUser?.name || 'Unknown',
            userRole: otherUser?.role || 'patient',
            lastMessage: msg.message,
            timestamp: msg.timestamp,
            unread: !msg.isRead && msg.receiverId === currentUser?.id ? 1 : 0
          };
        } else {
          if (new Date(msg.timestamp) > new Date(convMap[otherId].timestamp)) {
            convMap[otherId].lastMessage = msg.message;
            convMap[otherId].timestamp = msg.timestamp;
          }
          if (!msg.isRead && msg.receiverId === currentUser?.id) {
            convMap[otherId].unread += 1;
          }
        }
      });

      const convArray = Object.values(convMap).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setConversations(convArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://192.168.2.2:3000/api/messages/conversation/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    fetchMessages(conv.userId);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setMessages([]);
    fetchConversations();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://192.168.2.2:3000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          message: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedConversation.userId);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://192.168.2.2:3000/api/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        fetchMessages(selectedConversation.userId);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleClearConversation = async () => {
    if (!confirm('Are you sure you want to delete all messages in this conversation?')) return;

    try {
      const token = localStorage.getItem('token');
      
      for (const msg of messages) {
        await fetch(`http://192.168.2.2:3000/api/messages/${msg.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      setMessages([]);
      fetchConversations();
      alert('Conversation cleared successfully');
    } catch (error) {
      console.error('Error clearing conversation:', error);
      alert('Failed to clear conversation');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-blue-100 text-blue-800';
      case 'patient': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'expert': return 'Expert';
      case 'patient': return 'Patient';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Communicate with patients and experts</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-red-600">
                  {conversations.reduce((sum, conv) => sum + conv.unread, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {conversations.filter(c => {
                    const today = new Date().toDateString();
                    return new Date(c.timestamp).toDateString() === today;
                  }).length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Messages Interface */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-12 h-[600px]">
            {/* Conversations List */}
            <div className={`${selectedConversation ? 'hidden md:flex md:col-span-4' : 'col-span-12 md:col-span-4 flex'} flex-col border-r border-gray-200 h-full`}>
              <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <button
                      key={conv.userId}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.userId === conv.userId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {conv.userName}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(conv.userRole)}`}>
                              {getRoleLabel(conv.userRole)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(conv.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}

                  {conversations.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No conversations yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className={`${selectedConversation ? 'col-span-12 md:col-span-8' : 'col-span-8'} flex flex-col h-full overflow-hidden`}>
              {selectedConversation ? (
                <div className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBackToList}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white border border-gray-300 shadow-sm md:hidden"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {selectedConversation.userName}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedConversation.userRole)}`}>
                            {getRoleLabel(selectedConversation.userRole)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClearConversation}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Clear Chat</span>
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    )}
                    
                    {messages.map((msg) => {
                      const isCurrentUser = msg.senderId === currentUser?.id;
                      const senderName = isCurrentUser ? 'You' : (msg.sender?.name || 'Unknown');
                      const receiverName = isCurrentUser ? (selectedConversation.userName || 'Unknown') : 'You';
                      const displayRole = isCurrentUser 
                        ? (currentUser?.role || 'user')
                        : (msg.sender?.role || 'patient');
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                        >
                          <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className="flex items-center gap-2 px-2">
                              <span className={`text-xs font-medium ${
                                isCurrentUser ? 'text-blue-600' : 'text-green-600'
                              }`}>
                                {senderName}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className={`text-xs font-medium ${
                                isCurrentUser ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {receiverName}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${getRoleBadgeColor(displayRole)}`}>
                                {getRoleLabel(displayRole)}
                              </span>
                            </div>

                            <div className="flex items-end gap-2">
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isCurrentUser
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                              
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}