warning: in the working copy of 'src/components/notifications/NotificationBell.jsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/pages/Chat.jsx', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/src/components/notifications/NotificationBell.jsx b/src/components/notifications/NotificationBell.jsx[m
[1mindex 30a7434..a58ee3b 100644[m
[1m--- a/src/components/notifications/NotificationBell.jsx[m
[1m+++ b/src/components/notifications/NotificationBell.jsx[m
[36m@@ -24,10 +24,6 @@[m [mconst formatNotificationTime = (value) => {[m
   return `${Math.max(1, Math.floor(diff / day))}d ago`;[m
 };[m
 [m
[31m-<<<<<<< HEAD[m
[31m-export default function NotificationBell({ className = '', buttonClassName = '', panelClassName = '' }) {[m
[31m-  const { isAuthenticated } = useSelector((state) => state.auth);[m
[31m-=======[m
 const resolveNotificationLink = (notification, user) => {[m
   const metadata = notification?.metadata || {};[m
   const actorId = notification?.actor?._id || notification?.actor?.id || notification?.actor;[m
[36m@@ -104,9 +100,8 @@[m [mconst resolveNotificationLink = (notification, user) => {[m
   return notification?.link || '/dashboard';[m
 };[m
 [m
[31m-export default function NotificationBell() {[m
[32m+[m[32mexport default function NotificationBell({ className = '', buttonClassName = '', panelClassName = '' }) {[m
   const { isAuthenticated, user } = useSelector((state) => state.auth);[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
   const navigate = useNavigate();[m
   const panelRef = useRef(null);[m
   const [open, setOpen] = useState(false);[m
[36m@@ -208,11 +203,7 @@[m [mexport default function NotificationBell() {[m
   };[m
 [m
   return ([m
[31m-<<<<<<< HEAD[m
     <div ref={panelRef} className={`relative z-[120] ${className}`}>[m
[31m-=======[m
[31m-    <div ref={panelRef} className="fixed right-4 top-40 z-[120]">[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
       <button[m
         type="button"[m
         onClick={() => setOpen((current) => !current)}[m
[1mdiff --git a/src/pages/Chat.jsx b/src/pages/Chat.jsx[m
[1mindex b3aab8d..9c8bfe4 100644[m
[1m--- a/src/pages/Chat.jsx[m
[1m+++ b/src/pages/Chat.jsx[m
[36m@@ -9,11 +9,7 @@[m [mimport {[m
 } from '../redux/chatSlice';[m
 import { logout } from '../redux/authSlice';[m
 import api from '../api/axios';[m
[31m-<<<<<<< HEAD[m
[31m-import chatSocket from '../utils/socket.jsx';[m
[31m-=======[m
 import globalSocket from '../utils/socket.jsx';[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
 import {[m
     FaEllipsisV, FaPaperPlane, FaTimes, FaPhone, FaVideo, FaCommentDots,[m
     FaPaperclip, FaSignOutAlt, FaSearch, FaCheckDouble,[m
[36m@@ -144,18 +140,6 @@[m [mexport default function Chat() {[m
         if (!userId) return;[m
 [m
         // Use the global socket instance that's already connected at app startup[m
[31m-<<<<<<< HEAD[m
[31m-        if (!chatSocket.connected) {[m
[31m-            console.log(`🔌 [Chat] Connecting global socket...`);[m
[31m-            chatSocket.connect();[m
[31m-        }[m
[31m-[m
[31m-        // Sync local ref to the global socket so handleSend can use it[m
[31m-        socketRef.current = chatSocket;[m
[31m-[m
[31m-        // Define exactly what to do when events happen[m
[31m-        const onConnect = () => console.log("✅ [Chat] Socket Connected! ID:", chatSocket.id);[m
[31m-=======[m
         if (!globalSocket.connected) {[m
             console.log(`🔌 [Chat] Connecting global socket...`);[m
             globalSocket.connect();[m
[36m@@ -166,7 +150,6 @@[m [mexport default function Chat() {[m
 [m
         // Define exactly what to do when events happen[m
         const onConnect = () => console.log("✅ [Chat] Socket Connected! ID:", globalSocket.id);[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
         const onNewMessage = (msg) => {[m
             console.log("📨 [Chat EVENT] Live message received:", msg);[m
 [m
[36m@@ -184,16 +167,6 @@[m [mexport default function Chat() {[m
         const onDisconnect = () => console.log("🛑 [Chat] Socket Disconnected from server.");[m
 [m
         // Attach listeners to the global socket[m
[31m-<<<<<<< HEAD[m
[31m-        chatSocket.on("connect", onConnect);[m
[31m-        chatSocket.on("newMessage", onNewMessage);[m
[31m-        chatSocket.on("messageDeleted", onMessageDeleted);[m
[31m-        chatSocket.on("disconnect", onDisconnect);[m
[31m-[m
[31m-        // If the socket connected incredibly fast before the listener was attached[m
[31m-        if (chatSocket.connected) {[m
[31m-            console.log("✅ [Chat] Socket Already connected! ID:", chatSocket.id);[m
[31m-=======[m
         globalSocket.on("connect", onConnect);[m
         globalSocket.on("newMessage", onNewMessage);[m
         globalSocket.on("messageDeleted", onMessageDeleted);[m
[36m@@ -202,38 +175,24 @@[m [mexport default function Chat() {[m
         // If the socket connected incredibly fast before the listener was attached[m
         if (globalSocket.connected) {[m
             console.log("✅ [Chat] Socket Already connected! ID:", globalSocket.id);[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
         }[m
 [m
         // 🚨 CLEANUP: Do NOT disconnect the socket! Just remove the listeners.[m
         // This stops React from murdering the connection when you switch pages![m
         return () => {[m
             console.log("🧹 [Chat] Component unmounting. Removing listeners (Socket stays alive).");[m
[31m-<<<<<<< HEAD[m
[31m-            chatSocket.off("connect", onConnect);[m
[31m-            chatSocket.off("newMessage", onNewMessage);[m
[31m-            chatSocket.off("messageDeleted", onMessageDeleted);[m
[31m-            chatSocket.off("disconnect", onDisconnect);[m
[31m-=======[m
             globalSocket.off("connect", onConnect);[m
             globalSocket.off("newMessage", onNewMessage);[m
             globalSocket.off("messageDeleted", onMessageDeleted);[m
             globalSocket.off("disconnect", onDisconnect);[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
         };[m
     }, [dispatch, user?._id, user?.id]); // Stable dependency array[m
 [m
     // Destroy socket fully ONLY if user logs out[m
     useEffect(() => {[m
[31m-<<<<<<< HEAD[m
[31m-        if (!user && chatSocket.connected) {[m
[31m-            console.log("🚪 [Chat] User logged out. Disconnecting socket.");[m
[31m-            chatSocket.disconnect();[m
[31m-=======[m
         if (!user && globalSocket.connected) {[m
             console.log("🚪 [Chat] User logged out. Disconnecting socket.");[m
             globalSocket.disconnect();[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
         }[m
     }, [user]);[m
 [m
[36m@@ -314,14 +273,10 @@[m [mexport default function Chat() {[m
             setIsRecording(true);[m
             setRecordingTime(0);[m
             timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);[m
[31m-<<<<<<< HEAD[m
         } catch (err) {[m
             console.error("Microphone permission failed:", err);[m
             alert("Mic required");[m
         }[m
[31m-=======[m
[31m-        } catch { alert("Mic required"); }[m
[31m->>>>>>> 954d56e (files uploads & notification)[m
     };[m
 [m
     const stopRecording = () => {[m
[36m@@ -351,8 +306,8 @@[m [mexport default function Chat() {[m
 [m
         if (!socketRef.current || !socketRef.current.connected) {[m
             console.error("🚨 Socket is offline! Forcing reconnect before sending...");[m
[31m-            chatSocket.connect();[m
[31m-            socketRef.current = chatSocket;[m
[32m+[m[32m            globalSocket.connect();[m
[32m+[m[32m            socketRef.current = globalSocket;[m
         }[m
 [m
         console.log(`🚀 [Component] Emitting 'sendMessage' -> Text: "${text}"`);[m
