import { useState, useEffect, useRef } from "react";
import { FiX, FiSend } from "react-icons/fi";
import { initializePusher } from "../config/pusher";
import { API_URL } from "../config/api";
import styles from "./issueChatModal.module.css";

const IssueChatModal = ({ issue, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [pusher, setPusher] = useState(null);
  const [channel, setChannel] = useState(null);
  const [conversationId, setConversationId] = useState(issue.conversationId);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  console.log("👤 Current user from localStorage:", currentUser);

  // Determine recipient ID - normalize IDs to strings for comparison
  const currentUserId = String(currentUser._id || currentUser.id || "");
  const submittedById = String(issue.submittedBy);
  const assignedToId = String(issue.assignedTo);

  const recipientId =
    currentUserId === submittedById ? assignedToId : submittedById;

  console.log("🔍 Chat participants:", {
    currentUserId,
    submittedById,
    assignedToId,
    recipientId,
    issueId: issue._id,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Initialize Pusher
    const pusherInstance = initializePusher(token);
    setPusher(pusherInstance);

    // Subscribe to private channel for this issue
    const channelName = `private-issue-${issue._id}`;
    const channelInstance = pusherInstance.subscribe(channelName);

    channelInstance.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
      console.log(`✅ Subscribed to Pusher channel: ${channelName}`);

      // Load existing messages if conversation exists
      if (conversationId) {
        loadMessages(conversationId);
      } else {
        // Check if conversation exists for this issue
        findConversation();
      }
    });

    channelInstance.bind("pusher:subscription_error", (error) => {
      console.error("❌ Pusher subscription error:", error);
      setIsConnected(false);
    });

    // Listen for new messages
    channelInstance.bind(
      "message:new",
      ({ conversationId: convId, message }) => {
        console.log("\n=== NEW MESSAGE RECEIVED (PUSHER) ===");
        console.log("📩 Conversation:", convId);
        console.log(
          "📩 Message from:",
          message.sender.firstName,
          message.sender.lastName,
        );
        console.log("📩 Message ID:", message._id);

        // Dispatch event for unread indicator
        window.dispatchEvent(
          new CustomEvent("newChatMessage", {
            detail: {
              conversationId: convId,
              message,
            },
          }),
        );

        // Update conversationId if we didn't have one
        if (!conversationId && convId) {
          setConversationId(convId);
        }

        // Add message to state
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          if (exists) {
            console.log("⚠️ Message already exists, skipping");
            return prev;
          }
          console.log("✅ Message added to state");
          return [...prev, message];
        });

        console.log("=== MESSAGE RECEIVED COMPLETE ===\n");
      },
    );

    // Listen for conversation creation
    channelInstance.bind(
      "conversation:created",
      ({ issueId, conversationId: convId }) => {
        console.log(`✅ Conversation created for issue ${issueId}:`, convId);
        if (issueId === issue._id) {
          setConversationId(convId);
          loadMessages(convId);
        }
      },
    );

    setChannel(channelInstance);

    return () => {
      if (channelInstance) {
        channelInstance.unbind_all();
        pusherInstance.unsubscribe(channelName);
      }
      if (pusherInstance) {
        pusherInstance.disconnect();
      }
    };
  }, [issue._id]);

  const findConversation = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/chat/conversation/find?recipientId=${recipientId}&issueId=${issue._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.found) {
        console.log("✅ Found existing conversation:", data.conversationId);
        setConversationId(data.conversationId);
        loadMessages(data.conversationId);
      } else {
        console.log(
          "ℹ️ No existing conversation - will create on first message",
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Error finding conversation:", error);
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/chat/messages/${convId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) {
      console.log("❌ Cannot send message:", {
        hasInput: !!inputMessage.trim(),
        isConnected,
      });
      return;
    }

    console.log("📤 Sending message via Pusher:", {
      conversationId,
      issueId: issue._id,
      recipientId,
      message: inputMessage.substring(0, 30),
    });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/chat/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          message: inputMessage,
          recipientId,
          issueId: issue._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Message sent successfully");
        // Update conversationId if this was the first message
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }
        setInputMessage("");
      } else {
        console.error("❌ Failed to send message:", data.error);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipantName = () => {
    const currentUserId = String(currentUser._id || currentUser.id || "");
    const submittedById = String(issue.submittedBy || "");

    console.log("🔍 Getting other participant name:", {
      currentUserId,
      submittedById,
      isSubmitter: currentUserId === submittedById,
      assignedToName: issue.assignedToName,
      submittedByName: issue.submittedByName,
      messagesCount: messages.length,
    });

    // Try to get name from messages first (most reliable)
    if (messages.length > 0) {
      const otherUserMessage = messages.find(
        (msg) => String(msg.sender._id) !== currentUserId,
      );
      if (otherUserMessage?.sender) {
        const name = `${otherUserMessage.sender.firstName} ${otherUserMessage.sender.lastName}`;
        console.log("✅ Got name from messages:", name);
        return name;
      }
    }

    // Fallback to issue data
    if (currentUserId === submittedById) {
      // Current user is the submitter, show technician name
      const name = issue.assignedToName || "Technician";
      console.log("✅ Current user is submitter, showing technician:", name);
      return name;
    }
    // Current user is the technician, show submitter name
    const name = issue.submittedByName || "User";
    console.log("✅ Current user is technician, showing submitter:", name);
    return name;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3>{getOtherParticipantName()}</h3>
            <span className={styles.issueTitle}>{issue.title}</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.messagesContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>💬 No messages yet</p>
              <small>Start the conversation about this issue</small>
            </div>
          ) : (
            messages.map((msg) => {
              const isSentByMe = msg.sender._id === currentUser._id;
              return (
                <div
                  key={msg._id}
                  className={`${styles.message} ${
                    isSentByMe ? styles.sent : styles.received
                  }`}
                >
                  <div className={styles.messageContent}>
                    {!isSentByMe && (
                      <span className={styles.senderName}>
                        {msg.sender.firstName} {msg.sender.lastName}
                      </span>
                    )}
                    <p>{msg.message}</p>
                    <span className={styles.timestamp}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <input
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className={styles.input}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className={styles.sendButton}
          >
            <FiSend />
          </button>
        </div>

        <div className={styles.statusBar}>
          <span className={isConnected ? styles.online : styles.offline}>
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default IssueChatModal;
