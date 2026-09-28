import { useState, useEffect } from "react";
import { FiMessageCircle } from "react-icons/fi";
import IssueChatModal from "./IssueChatModal";
import styles from "./issueChatButton.module.css";

const IssueChatButton = ({ issue, currentUserId }) => {
  const [showChat, setShowChat] = useState(() => {
    const openChatIssueId = localStorage.getItem("openChatIssueId");
    return openChatIssueId === issue._id;
  });
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Listen for new messages for this issue
    const handleNewMessage = (event) => {
      const { issueId, conversationId, message } = event.detail;

      console.log("🔔 Chat button received message event:", {
        eventIssueId: issueId,
        eventConversationId: conversationId,
        thisIssueId: issue._id,
        thisConversationId: issue.conversationId,
        messageSender: message?.sender?._id,
        currentUserId,
        chatIsOpen: showChat,
      });

      // Check if message is for this issue - prioritize issueId match
      const isForThisIssue =
        (issueId && issueId === issue._id) ||
        (conversationId && conversationId === issue.conversationId);

      // Check if message is from other user
      const isFromOtherUser =
        message?.sender?._id &&
        String(message.sender._id) !== String(currentUserId);

      console.log("🔍 Should show unread?", {
        isForThisIssue,
        isFromOtherUser,
        chatIsOpen: showChat,
        result: isForThisIssue && !showChat && isFromOtherUser,
      });

      // Only show indicator if:
      // 1. Message is for this issue
      // 2. Chat is closed
      // 3. Message is NOT from current user
      if (isForThisIssue && !showChat && isFromOtherUser) {
        console.log("✅ Showing unread dot for issue:", issue._id);
        setHasUnread(true);
      }
    };

    window.addEventListener("newChatMessage", handleNewMessage);

    return () => {
      window.removeEventListener("newChatMessage", handleNewMessage);
    };
  }, [issue._id, issue.conversationId, showChat, currentUserId]);

  const isAssigned = issue.assignedTo || issue.assignedToName;

  if (!isAssigned) {
    return (
      <span style={{ fontSize: "12px", color: "#999", padding: "8px" }}>
        (Not assigned)
      </span>
    );
  }

  const handleOpenChat = () => {
    setShowChat(true);
    setHasUnread(false);
    localStorage.setItem("openChatIssueId", issue._id);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    localStorage.removeItem("openChatIssueId");
  };

  return (
    <>
      <button
        className={styles.chatButton}
        onClick={handleOpenChat}
        title="Chat about this issue"
      >
        <FiMessageCircle />
        Chat
        {hasUnread && <span className={styles.unreadDot}></span>}
      </button>

      {showChat && <IssueChatModal issue={issue} onClose={handleCloseChat} />}
    </>
  );
};

export default IssueChatButton;
