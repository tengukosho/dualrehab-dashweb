import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, MessageSquare, Trash2, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useDarkMode } from '../components/DarkModeProvider';
import { useI18n } from '../lib/i18n/I18nContext';

export default function Messages() {
  const { isDark } = useDarkMode();
  const { t } = useI18n();
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

  useEffect(() => {
    if (location.state?.selectedUser && currentUser) {
      const user = location.state.selectedUser;
      const existingConv = conversations.find(c => c.userId === user.id);
      
      if (existingConv) {
        handleSelectConversation(existingConv);
      } else {
        const newConv = {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          lastMessage: t('messages.startConversation'),
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
        headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      const convMap = {};
      data.messages.forEach(msg => {
        const otherId = msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
        const otherUser = msg.senderId === currentUser?.id ? msg.receiver : msg.sender;
        
        if (otherId === currentUser?.id) return;
        
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
        { headers: { 'Authorization': `Bearer ${token}` } }
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
    if (!confirm(t('messages.confirmDelete') || 'Delete this message?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://192.168.2.2:3000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok && selectedConversation) {
        fetchMessages(selectedConversation.userId);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleClearConversation = async () => {
    if (!selectedConversation) return;
    if (!confirm(t('messages.confirmClear') || 'Clear all messages?')) return;

    try {
      const token = localStorage.getItem('token');
      await Promise.all(messages.map(msg => 
        fetch(`http://192.168.2.2:3000/api/messages/${msg.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));

      setMessages([]);
      fetchConversations();
    } catch (error) {
      console.error('Error clearing conversation:', error);
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
      case 'admin': return t('users.admin');
      case 'expert': return t('users.expert');
      case 'patient': return t('users.patient');
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('messages.title')}
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('messages.conversations')}
        </p>
      </div>

      <div className={`rounded-lg shadow overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-12 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden md:block' : 'block'} col-span-12 md:col-span-4 border-r ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          } overflow-hidden flex flex-col`}>
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('messages.conversations')}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 border-b transition-colors text-left ${
                    selectedConversation?.userId === conv.userId
                      ? isDark ? 'bg-blue-900/30 border-gray-700' : 'bg-blue-50 border-gray-200'
                      : isDark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold truncate text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {conv.userName}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(conv.userRole)}`}>
                          {getRoleLabel(conv.userRole)}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {conv.lastMessage}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
                <div className={`p-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className="text-sm">{t('messages.noMessages')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className={`${selectedConversation ? 'col-span-12 md:col-span-8' : 'hidden md:flex md:col-span-8'} flex flex-col h-full overflow-hidden`}>
            {selectedConversation ? (
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToList}
                      className={`p-2 rounded-lg transition-colors md:hidden ${
                        isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                    >
                      <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                    </button>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedConversation.userName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedConversation.userRole)}`}>
                        {getRoleLabel(selectedConversation.userRole)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleClearConversation}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm ${
                      isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('common.clear')}</span>
                  </button>
                </div>

                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  {messages.length === 0 && (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className="text-sm">{t('messages.startConversation')}</p>
                    </div>
                  )}
                  
                  {messages.map((msg) => {
                    const isCurrentUser = msg.senderId === currentUser?.id;
                    const senderName = isCurrentUser ? 'You' : (msg.sender?.name || 'Unknown');
                    const receiverName = isCurrentUser ? (selectedConversation.userName || 'Unknown') : 'You';
                    const displayRole = isCurrentUser ? (currentUser?.role || 'user') : (msg.sender?.role || 'patient');
                    
                    return (
                      <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className="flex items-center gap-2 px-2">
                            <span className={`text-xs font-medium ${isCurrentUser ? 'text-blue-600' : 'text-green-600'}`}>
                              {senderName}
                            </span>
                            <ArrowRight className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={`text-xs font-medium ${isCurrentUser ? 'text-green-600' : 'text-blue-600'}`}>
                              {receiverName}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getRoleBadgeColor(displayRole)}`}>
                              {getRoleLabel(displayRole)}
                            </span>
                          </div>

                          <div className="flex items-end gap-2">
                            <div className={`rounded-lg px-4 py-2 ${
                              isCurrentUser
                                ? 'bg-blue-600 text-white'
                                : isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all ${
                                isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                              }`}
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
                <form onSubmit={handleSendMessage} className={`p-4 border-t ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('messages.typeMessage')}
                      className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('messages.send')}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className={`flex-1 flex items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <div className="text-center">
                  <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className="text-sm">{t('messages.selectConversation')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
