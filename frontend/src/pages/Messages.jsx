import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Smile,
  ImagePlus,
  MoreVertical,
  Palette,
  Trash2,
  Pencil,
  X,
  Check,
  ArrowLeft,
  Mic,
  Square,
  Users,
  Plus,
  UserPlus,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/media";
import EmojiPicker from "../components/EmojiPicker";
import ThemePicker, { THEMES } from "../components/ThemePicker";

// =====================================================
// HELPERS
// =====================================================

function getTheme(id) {
  const key = localStorage.getItem(`chat-theme:${id}`);
  return THEMES[key] ? key : "classic";
}

function formatMessageTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageDate(date) {
  if (!date) return "";

  const messageDate = new Date(date);
  const today = new Date();

  const sameDay =
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear();

  if (sameDay) return "Today";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isYesterday =
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return messageDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year:
      messageDate.getFullYear() === today.getFullYear()
        ? undefined
        : "numeric",
  });
}

function getUserId(value) {
  if (!value) return null;

  if (typeof value === "object") {
    return value._id?.toString() || null;
  }

  return value.toString();
}

function getUserAvatar(person) {
  if (!person) return null;

  return (
    mediaUrl(person.avatar) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      person.username || person._id || "user"
    }`
  );
}

function getUserName(person) {
  if (!person) return "User";

  return (
    person.username ||
    person.fullName ||
    "User"
  );
}

// =====================================================
// COMPONENT
// =====================================================

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Direct chats
  const [conversations, setConversations] = useState([]);

  // Real groups from DB
  const [groups, setGroups] = useState([]);

  // Active chat
  const [active, setActive] = useState(null);

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [openMsgMenu, setOpenMsgMenu] = useState(null);

  const [editingId, setEditingId] = useState(null);

  // Group modal
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const [theme, setTheme] = useState("classic");

  // ===================================================
  // LOAD DIRECT CHATS + GROUPS
  // ===================================================

  async function loadAllChats() {
    try {
      const [directRes, groupRes] = await Promise.all([
        api.get("/messages/conversations"),
        api.get("/groups"),
      ]);

      // IMPORTANT:
      // Only keep valid direct conversations.
      // This prevents:
      // Cannot read properties of undefined (reading 'avatar')
      const directData = Array.isArray(directRes.data)
        ? directRes.data
        : [];

      const safeDirectConversations = directData.filter(
        (conversation) =>
          conversation &&
          conversation.otherUser &&
          conversation.otherUser._id
      );

      const groupData = Array.isArray(groupRes.data)
        ? groupRes.data
        : [];

      const safeGroups = groupData.filter(
        (group) =>
          group &&
          group._id &&
          group.name
      );

      setConversations(safeDirectConversations);
      setGroups(safeGroups);

      return {
        direct: safeDirectConversations,
        groups: safeGroups,
      };
    } catch (error) {
      console.error("Failed to load chats:", error);

      setConversations([]);
      setGroups([]);

      return {
        direct: [],
        groups: [],
      };
    }
  }

  useEffect(() => {
    async function initialize() {
      const data = await loadAllChats();

      const targetUsername = searchParams.get("user");

      if (targetUsername) {
        const existing = data.direct.find(
          (c) =>
            c?.otherUser?.username === targetUsername
        );

        if (existing?.otherUser?._id) {
          setActive({
            type: "direct",
            ...existing,
          });

          return;
        }

        try {
          const profileRes = await api.get(
            `/users/${targetUsername}`
          );

          if (!profileRes.data?._id) {
            return;
          }

          const otherUser = {
            _id: profileRes.data._id,
            username: profileRes.data.username,
            avatar: profileRes.data.avatar,
            fullName: profileRes.data.fullName,
          };

          setActive({
            type: "direct",
            otherUser,
            lastMessage: "",
          });
        } catch (error) {
          console.error(
            "Failed to load user:",
            error
          );
        }

        return;
      }

      setActive(null);
    }

    initialize();
  }, []);

  // ===================================================
  // LOAD ACTIVE THREAD
  // ===================================================

  useEffect(() => {
    if (!active) return;

    setHeaderMenu(false);
    setOpenMsgMenu(null);
    setEditingId(null);
    setText("");
    setFile(null);
    setPreview(null);

    const id =
      active.type === "group"
        ? active._id
        : active.otherUser?._id;

    if (!id) return;

    setTheme(getTheme(id));
    loadThread();
  }, [
    active?.type,
    active?._id,
    active?.otherUser?._id,
  ]);

  async function loadThread() {
    if (!active) return;

    try {
      let res;

      if (active.type === "group") {
        res = await api.get(
          `/messages/group/${active._id}`
        );
      } else {
        if (!active.otherUser?._id) {
          setMessages([]);
          return;
        }

        res = await api.get(
          `/messages/${active.otherUser._id}`
        );
      }

      setMessages(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load messages:",
        error
      );

      setMessages([]);
    }
  }

  // ===================================================
  // SCROLL
  // ===================================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ===================================================
  // GROUP FUNCTIONS
  // ===================================================

  function openNewGroup() {
    setGroupName("");
    setGroupSearch("");
    setSelectedUsers([]);
    setUsers([]);
    setShowNewGroup(true);
  }

  async function searchGroupUsers(value) {
    setGroupSearch(value);

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    try {
      const res = await api.get(
        `/users/search?q=${encodeURIComponent(
          value.trim()
        )}`
      );

      const result = Array.isArray(res.data)
        ? res.data
        : [];

      setUsers(
        result.filter(
          (person) =>
            getUserId(person) !==
            getUserId(user)
        )
      );
    } catch (error) {
      console.error(
        "Failed to search users:",
        error
      );

      setUsers([]);
    }
  }

  function toggleGroupUser(person) {
    if (!person?._id) return;

    setSelectedUsers((current) => {
      const exists = current.some(
        (u) =>
          getUserId(u) ===
          getUserId(person)
      );

      if (exists) {
        return current.filter(
          (u) =>
            getUserId(u) !==
            getUserId(person)
        );
      }

      return [...current, person];
    });
  }

  async function createNewGroup() {
    if (
      !groupName.trim() ||
      selectedUsers.length === 0
    ) {
      return;
    }

    try {
      const res = await api.post(
        "/groups",
        {
          name: groupName.trim(),
          members: selectedUsers.map(
            (person) => person._id
          ),
        }
      );

      const newGroup = res.data;

      if (!newGroup?._id) {
        throw new Error("Invalid group response");
      }

      setGroups((current) => [
        newGroup,
        ...current.filter(
          (g) =>
            g?._id !== newGroup._id
        ),
      ]);

      setShowNewGroup(false);
      setGroupName("");
      setGroupSearch("");
      setUsers([]);
      setSelectedUsers([]);

      setActive({
        type: "group",
        ...newGroup,
      });

      setSearchParams({});
    } catch (error) {
      console.error(
        "Create group failed:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create group"
      );
    }
  }

  // ===================================================
  // FILE
  // ===================================================

  function handleFile(e) {
    const selectedFile =
      e.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);

    if (
      selectedFile.type.startsWith(
        "image/"
      )
    ) {
      setPreview(
        URL.createObjectURL(
          selectedFile
        )
      );
    } else {
      setPreview(null);
    }
  }

  // ===================================================
  // VOICE
  // ===================================================

  async function startRecording() {
    if (!active || isRecording) return;

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      audioChunksRef.current = [];

      recorder.ondataavailable =
        (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onstop = async () => {
        const audioBlob =
          new Blob(
            audioChunksRef.current,
            {
              type:
                recorder.mimeType ||
                "audio/webm",
            }
          );

        const audioFile =
          new File(
            [audioBlob],
            `voice-${Date.now()}.webm`,
            {
              type: audioBlob.type,
            }
          );

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        setIsRecording(false);
        setRecordingTime(0);

        const form =
          new FormData();

        form.append(
          "media",
          audioFile
        );

        try {
          let res;

          if (
            active.type ===
            "group"
          ) {
            res =
              await api.post(
                `/messages/group/${active._id}`,
                form,
                {
                  headers: {
                    "Content-Type":
                      "multipart/form-data",
                  },
                }
              );
          } else {
            if (!active.otherUser?._id) return;

            res =
              await api.post(
                `/messages/${active.otherUser._id}`,
                form,
                {
                  headers: {
                    "Content-Type":
                      "multipart/form-data",
                  },
                }
              );
          }

          if (res.data) {
            setMessages((current) => [
              ...current,
              res.data,
            ]);
          }

          await loadAllChats();
        } catch (error) {
          console.error(
            "Voice message failed:",
            error
          );

          alert(
            error.response?.data?.message ||
              "Voice message could not be sent."
          );
        }
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingTime(
            (time) => time + 1
          );
        }, 1000);
    } catch (error) {
      console.error(
        "Microphone permission error:",
        error
      );

      alert(
        "Please allow microphone access to record a voice message."
      );
    }
  }

  function stopRecording() {
    if (
      !mediaRecorderRef.current
    ) {
      return;
    }

    clearInterval(
      recordingTimerRef.current
    );

    mediaRecorderRef.current.stop();

    mediaRecorderRef.current =
      null;
  }

  function formatRecordingTime(seconds) {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const secs =
      seconds % 60;

    return `${minutes}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // ===================================================
  // SEND
  // ===================================================

  async function send(e) {
    e.preventDefault();

    if (
      !active ||
      (!text.trim() && !file)
    ) {
      return;
    }

    // EDIT
    if (editingId) {
      try {
        const res =
          await api.put(
            `/messages/message/${editingId}`,
            {
              text,
            }
          );

        setMessages((current) =>
          current.map((msg) =>
            msg._id === editingId
              ? res.data
              : msg
          )
        );

        setEditingId(null);
        setText("");

        return;
      } catch (error) {
        console.error(
          "Edit failed:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to edit message"
        );

        return;
      }
    }

    const form =
      new FormData();

    if (text.trim()) {
      form.append(
        "text",
        text.trim()
      );
    }

    if (file) {
      form.append(
        "media",
        file
      );
    }

    try {
      let res;

      if (
        active.type ===
        "group"
      ) {
        res =
          await api.post(
            `/messages/group/${active._id}`,
            form,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );
      } else {
        if (!active.otherUser?._id) {
          alert("This conversation is unavailable.");
          return;
        }

        res =
          await api.post(
            `/messages/${active.otherUser._id}`,
            form,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );
      }

      if (res.data) {
        setMessages((current) => [
          ...current,
          res.data,
        ]);
      }

      setText("");
      setFile(null);
      setPreview(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      await loadAllChats();
    } catch (error) {
      console.error(
        "Send message failed:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to send message"
      );
    }
  }

  // ===================================================
  // MESSAGE ACTIONS
  // ===================================================

  function startEdit(message) {
    if (!message?.text) return;

    setEditingId(
      message._id
    );

    setText(
      message.text
    );

    setOpenMsgMenu(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setText("");
  }

  async function unsendMessage(id) {
    try {
      const res =
        await api.delete(
          `/messages/message/${id}?scope=everyone`
        );

      setMessages((current) =>
        current.map((msg) =>
          msg._id === id
            ? res.data
            : msg
        )
      );

      setOpenMsgMenu(null);
    } catch (error) {
      console.error(
        "Unsend failed:",
        error
      );
    }
  }

  async function deleteForMe(id) {
    try {
      await api.delete(
        `/messages/message/${id}?scope=me`
      );

      setMessages((current) =>
        current.filter(
          (msg) =>
            msg._id !== id
        )
      );

      setOpenMsgMenu(null);
    } catch (error) {
      console.error(
        "Delete failed:",
        error
      );
    }
  }

  async function clearDirectConversation() {
    if (
      !active ||
      active.type !==
        "direct" ||
      !active.otherUser?._id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete your entire conversation with ${getUserName(
          active.otherUser
        )}? This only removes it for you.`
      );

    if (!confirmed) return;

    try {
      await api.delete(
        `/messages/conversation/${active.otherUser._id}`
      );

      setMessages([]);

      setConversations(
        (current) =>
          current.filter(
            (c) =>
              c?.otherUser?._id !==
              active.otherUser._id
          )
      );

      setHeaderMenu(false);
    } catch (error) {
      console.error(
        "Clear conversation failed:",
        error
      );
    }
  }

  function selectEmoji(emoji) {
    setText(
      (current) =>
        current + emoji
    );
  }

  function selectTheme(key) {
    if (!active) return;

    const id =
      active.type === "group"
        ? active._id
        : active.otherUser?._id;

    if (!id) return;

    localStorage.setItem(
      `chat-theme:${id}`,
      key
    );

    setTheme(key);
    setShowTheme(false);
  }

  // ===================================================
  // SELECT CHAT
  // ===================================================

  function openDirectChat(conversation) {
    if (!conversation?.otherUser?._id) {
      return;
    }

    setActive({
      type: "direct",
      ...conversation,
    });

    setSearchParams({});
  }

  function openGroupChat(group) {
    if (!group?._id) {
      return;
    }

    setActive({
      type: "group",
      ...group,
    });

    setSearchParams({});
  }

  function closeChat() {
    setActive(null);
    setMessages([]);
    setSearchParams({});
  }

  const themeConf =
    THEMES[theme] ||
    THEMES.classic;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-panel rounded-2xl shadow-card border border-line overflow-hidden -mx-4 md:-mx-0">

      {/* =================================================
          NEW GROUP MODAL
      ================================================= */}

      {showNewGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-panel border border-line rounded-2xl shadow-popover overflow-hidden">

            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">
                  New group
                </h2>

                <p className="text-xs text-faint mt-0.5">
                  Create a group with your friends
                </p>
              </div>

              <button
                onClick={() =>
                  setShowNewGroup(false)
                }
                className="p-2 rounded-full hover:bg-soft text-faint"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              <div>
                <label className="block text-xs font-medium text-faint mb-2">
                  Group name
                </label>

                <input
                  value={groupName}
                  onChange={(e) =>
                    setGroupName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Friends"
                  autoFocus
                  className="w-full bg-soft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-faint mb-2">
                  Add people
                </label>

                <div className="relative">
                  <UserPlus
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />

                  <input
                    value={groupSearch}
                    onChange={(e) =>
                      searchGroupUsers(
                        e.target.value
                      )
                    }
                    placeholder="Search people..."
                    className="w-full bg-soft border border-line rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-brand-pink/50"
                  />
                </div>
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(
                    (person) => (
                      <button
                        key={
                          person._id
                        }
                        type="button"
                        onClick={() =>
                          toggleGroupUser(
                            person
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-pink text-white text-xs font-medium"
                      >
                        {getUserName(person)}
                        <X size={12} />
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="max-h-52 overflow-y-auto">

                {users.length > 0 ? (
                  <div className="space-y-1">

                    {users.map(
                      (person) => {
                        const selected =
                          selectedUsers.some(
                            (u) =>
                              getUserId(u) ===
                              getUserId(person)
                          );

                        return (
                          <button
                            key={
                              person._id
                            }
                            type="button"
                            onClick={() =>
                              toggleGroupUser(
                                person
                              )
                            }
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                              selected
                                ? "bg-soft"
                                : "hover:bg-soft"
                            }`}
                          >
                            <img
                              src={getUserAvatar(
                                person
                              )}
                              className="w-10 h-10 rounded-full object-cover"
                              alt=""
                            />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {getUserName(person)}
                              </p>

                              {person.fullName && (
                                <p className="text-xs text-faint truncate">
                                  {person.fullName}
                                </p>
                              )}
                            </div>

                            {selected && (
                              <div className="w-6 h-6 rounded-full bg-brand-pink text-white flex items-center justify-center">
                                <Check size={14} />
                              </div>
                            )}
                          </button>
                        );
                      }
                    )}

                  </div>
                ) : groupSearch ? (
                  <p className="text-center text-xs text-faint py-6">
                    No people found
                  </p>
                ) : (
                  <p className="text-center text-xs text-faint py-5">
                    Search for people to add
                  </p>
                )}

              </div>

              <button
                type="button"
                onClick={
                  createNewGroup
                }
                disabled={
                  !groupName.trim() ||
                  selectedUsers.length ===
                    0
                }
                className="w-full py-3 rounded-xl bg-brand-pink text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Create group
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =================================================
          LEFT SIDEBAR
      ================================================= */}

      <aside
        className={`w-full sm:w-80 border-r border-line flex-col ${
          active
            ? "hidden sm:flex"
            : "flex"
        }`}
      >

        <div className="px-4 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">
              Messages
            </h2>

            <p className="text-[11px] text-faint mt-0.5">
              Your conversations
            </p>
          </div>

          <button
            onClick={
              openNewGroup
            }
            className="w-9 h-9 rounded-full bg-soft hover:bg-brand-pink hover:text-white flex items-center justify-center text-faint transition"
            title="Create group"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* DIRECT */}

          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">
              Direct messages
            </p>
          </div>

          {conversations.length === 0 ? (
            <p className="px-4 py-4 text-xs text-faint">
              No direct conversations yet.
            </p>
          ) : (
            conversations.map(
              (conversation) => {

                // EXTRA SAFETY:
                // Never render a broken conversation.
                if (
                  !conversation?.otherUser?._id
                ) {
                  return null;
                }

                const otherUser =
                  conversation.otherUser;

                return (
                  <button
                    key={
                      otherUser._id
                    }
                    onClick={() =>
                      openDirectChat(
                        conversation
                      )
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      active?.type ===
                        "direct" &&
                      active?.otherUser
                        ?._id ===
                        otherUser._id
                        ? "bg-soft"
                        : "hover:bg-soft/70"
                    }`}
                  >

                    <img
                      src={getUserAvatar(
                        otherUser
                      )}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                      alt=""
                    />

                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-semibold truncate">
                        {getUserName(
                          otherUser
                        )}
                      </p>

                      <p className="text-xs text-faint truncate mt-0.5">
                        {conversation.lastMessage ||
                          "Start a conversation"}
                      </p>

                    </div>

                  </button>
                );
              }
            )
          )}

          {/* GROUPS */}

          <div className="px-4 pt-5 pb-2 flex items-center justify-between">

            <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">
              Groups
            </p>

            {groups.length > 0 && (
              <span className="text-[10px] text-faint">
                {groups.length}
              </span>
            )}

          </div>

          {groups.length === 0 ? (
            <div className="px-4 py-5">

              <div className="flex flex-col items-center text-center">

                <div className="w-10 h-10 rounded-full bg-soft flex items-center justify-center text-faint mb-2">
                  <Users size={18} />
                </div>

                <p className="text-xs text-faint">
                  No groups yet
                </p>

                <button
                  onClick={
                    openNewGroup
                  }
                  className="text-xs text-brand-pink font-semibold mt-2"
                >
                  Create a group
                </button>

              </div>

            </div>
          ) : (
            groups.map(
              (group) => {

                if (
                  !group?._id ||
                  !group?.name
                ) {
                  return null;
                }

                return (
                  <button
                    key={group._id}
                    onClick={() =>
                      openGroupChat(
                        group
                      )
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      active?.type ===
                        "group" &&
                      active?._id ===
                        group._id
                        ? "bg-soft"
                        : "hover:bg-soft/70"
                    }`}
                  >

                    <div className="w-11 h-11 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink font-semibold shrink-0 overflow-hidden">

                      {group.avatar ? (
                        <img
                          src={mediaUrl(
                            group.avatar
                          )}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <Users size={19} />
                      )}

                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-semibold truncate">
                        {group.name}
                      </p>

                      <p className="text-xs text-faint truncate mt-0.5">
                        {Array.isArray(
                          group.members
                        )
                          ? group.members.length
                          : 0}{" "}
                        members
                      </p>

                    </div>

                  </button>
                );
              }
            )
          )}

        </div>
      </aside>

      {/* =================================================
          CHAT AREA
      ================================================= */}

      <main
        className={`flex-1 flex-col min-w-0 ${
          active
            ? "flex"
            : "hidden sm:flex"
        }`}
      >

        {active ? (
          <>

            {/* HEADER */}

            <header className="px-3 sm:px-4 py-3 border-b border-line flex items-center gap-2 sm:gap-3 relative bg-panel">

              <button
                onClick={
                  closeChat
                }
                className="sm:hidden p-2 -ml-1 rounded-full hover:bg-soft text-faint"
              >
                <ArrowLeft size={20} />
              </button>

              {active.type ===
              "group" ? (
                <div className="w-9 h-9 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center shrink-0 overflow-hidden">
                  {active.avatar ? (
                    <img
                      src={mediaUrl(
                        active.avatar
                      )}
                      className="w-full h-full rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <Users size={17} />
                  )}
                </div>
              ) : (
                <img
                  src={getUserAvatar(
                    active.otherUser
                  )}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                  alt=""
                />
              )}

              <div className="min-w-0">

                <p className="text-sm font-semibold truncate">
                  {active.type ===
                  "group"
                    ? active.name
                    : getUserName(
                        active.otherUser
                      )}
                </p>

                {active.type ===
                  "group" && (
                  <p className="text-[11px] text-faint">
                    {Array.isArray(
                      active.members
                    )
                      ? active.members.length
                      : 0}{" "}
                    members
                  </p>
                )}

              </div>

              <div className="ml-auto flex items-center gap-1 relative">

                <button
                  onClick={() =>
                    setShowTheme(
                      (v) => !v
                    )
                  }
                  className="p-2 rounded-full hover:bg-soft text-faint"
                  title="Chat theme"
                >
                  <Palette size={18} />
                </button>

                {showTheme && (
                  <ThemePicker
                    current={theme}
                    onSelect={
                      selectTheme
                    }
                    onClose={() =>
                      setShowTheme(
                        false
                      )
                    }
                  />
                )}

                <button
                  onClick={() =>
                    setHeaderMenu(
                      (v) => !v
                    )
                  }
                  className="p-2 rounded-full hover:bg-soft text-faint"
                >
                  <MoreVertical size={18} />
                </button>

                {headerMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-panel border border-line shadow-popover rounded-xl py-1 z-50">

                    {active.type ===
                      "direct" && (
                      <button
                        onClick={
                          clearDirectConversation
                        }
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-soft text-left"
                      >
                        <Trash2 size={15} />
                        Delete conversation
                      </button>
                    )}

                    {active.type ===
                      "group" && (
                      <div className="px-4 py-2.5 text-xs text-faint">
                        Group chat
                      </div>
                    )}

                  </div>
                )}

                <button
                  onClick={
                    closeChat
                  }
                  className="hidden sm:flex p-2 rounded-full hover:bg-soft text-faint"
                  title="Close"
                >
                  <X size={18} />
                </button>

              </div>
            </header>

            {/* MESSAGES */}

            <div
              className={`flex-1 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-1.5 ${themeConf.background}`}
              style={
                themeConf.wallpaper
                  ? {
                      backgroundImage: `url(${themeConf.wallpaper})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "repeat",
                    }
                  : undefined
              }
            >

              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center">

                  <div className="text-center">

                    <div className="w-14 h-14 rounded-full bg-soft flex items-center justify-center mx-auto mb-3">

                      {active.type ===
                      "group" ? (
                        <Users
                          size={23}
                          className="text-faint"
                        />
                      ) : (
                        <Send
                          size={21}
                          className="text-faint"
                        />
                      )}

                    </div>

                    <p className="text-sm font-medium">
                      {active.type ===
                      "group"
                        ? `Start chatting in ${active.name}`
                        : `Say hi to ${getUserName(
                            active.otherUser
                          )}`}
                    </p>

                    <p className="text-xs text-faint mt-1">
                      Send a message to get started
                    </p>

                  </div>

                </div>
              )}

              {messages.map(
                (message, index) => {

                  if (!message?._id) {
                    return null;
                  }

                  const previous =
                    messages[
                      index - 1
                    ];

                  const currentDate =
                    message.createdAt
                      ? new Date(
                          message.createdAt
                        ).toDateString()
                      : "";

                  const previousDate =
                    previous?.createdAt
                      ? new Date(
                          previous.createdAt
                        ).toDateString()
                      : null;

                  const showDate =
                    currentDate !==
                    previousDate;

                  const senderId =
                    getUserId(
                      message.sender
                    );

                  const myId =
                    getUserId(user);

                  const isMe =
                    senderId ===
                    myId;

                  const sender =
                    typeof message.sender ===
                    "object"
                      ? message.sender
                      : null;

                  return (
                    <div
                      key={
                        message._id
                      }
                    >

                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 rounded-full bg-soft/90 backdrop-blur-sm text-faint text-[11px] font-medium">
                            {formatMessageDate(
                              message.createdAt
                            )}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex ${
                          isMe
                            ? "justify-end"
                            : "justify-start"
                        } group relative`}
                      >

                        <div
                          className={`relative max-w-[82%] sm:max-w-[70%] ${
                            active.type ===
                              "group" &&
                            !isMe
                              ? "pl-8"
                              : ""
                          }`}
                        >

                          {active.type ===
                            "group" &&
                            !isMe && (
                              <img
                                src={getUserAvatar(
                                  sender
                                )}
                                className="absolute left-0 bottom-1 w-6 h-6 rounded-full object-cover"
                                alt=""
                              />
                            )}

                          {active.type ===
                            "group" &&
                            !isMe && (
                              <p className="text-[10px] text-faint mb-1 ml-1">
                                {getUserName(
                                  sender
                                )}
                              </p>
                            )}

                          {message.unsent ? (
                            <div className="px-4 py-2 rounded-2xl bg-soft text-faint text-xs italic">
                              Message was unsent
                            </div>
                          ) : (
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm ${
                                isMe
                                  ? `${themeConf.bubble} ${themeConf.bubbleText} rounded-br-sm`
                                  : "bg-soft text-body rounded-bl-sm"
                              }`}
                            >

                              {message.storyReply && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">

                                  {message.storyReply.mediaType ===
                                  "video" ? (
                                    <video
                                      src={mediaUrl(
                                        message.storyReply.mediaUrl
                                      )}
                                      className="w-8 h-11 object-cover rounded"
                                    />
                                  ) : (
                                    <img
                                      src={mediaUrl(
                                        message.storyReply.mediaUrl
                                      )}
                                      className="w-8 h-11 object-cover rounded"
                                      alt=""
                                    />
                                  )}

                                  <span className="text-[10px] opacity-80">
                                    {isMe
                                      ? "Replied to their story"
                                      : "Replied to your story"}
                                  </span>

                                </div>
                              )}

                              {message.mediaUrl &&
                                (
                                  message.mediaType ===
                                  "video" ? (
                                    <video
                                      src={mediaUrl(
                                        message.mediaUrl
                                      )}
                                      controls
                                      className="rounded-xl max-w-full max-h-80 mb-1"
                                    />
                                  ) : message.mediaType ===
                                    "audio" ? (
                                    <audio
                                      src={mediaUrl(
                                        message.mediaUrl
                                      )}
                                      controls
                                      className="max-w-full mb-1"
                                    />
                                  ) : (
                                    <img
                                      src={mediaUrl(
                                        message.mediaUrl
                                      )}
                                      className="rounded-xl max-w-full max-h-80 object-cover mb-1"
                                      alt=""
                                    />
                                  )
                                )}

                              {message.text && (
                                <span className="whitespace-pre-wrap break-words">
                                  {message.text}
                                </span>
                              )}

                              {message.editedAt && (
                                <span className="text-[9px] ml-1.5 opacity-60">
                                  edited
                                </span>
                              )}

                              <div
                                className={`text-[9px] mt-1 text-right ${
                                  isMe
                                    ? "text-white/65"
                                    : "text-faint"
                                }`}
                              >
                                {formatMessageTime(
                                  message.createdAt
                                )}
                              </div>

                            </div>
                          )}

                          {!message.unsent && (
                            <button
                              onClick={() =>
                                setOpenMsgMenu(
                                  openMsgMenu ===
                                    message._id
                                    ? null
                                    : message._id
                                )
                              }
                              className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-panel border border-line text-faint opacity-0 group-hover:opacity-100 transition ${
                                isMe
                                  ? "-left-9"
                                  : "-right-9"
                              }`}
                            >
                              <MoreVertical
                                size={14}
                              />
                            </button>
                          )}

                          {openMsgMenu ===
                            message._id && (
                            <div
                              className={`absolute z-50 top-full mt-1 w-40 bg-panel border border-line shadow-popover rounded-xl py-1 ${
                                isMe
                                  ? "right-0"
                                  : "left-0"
                              }`}
                            >

                              {isMe &&
                                !message.mediaUrl && (
                                  <button
                                    onClick={() =>
                                      startEdit(
                                        message
                                      )
                                    }
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-soft text-left"
                                  >
                                    <Pencil size={13} />
                                    Edit
                                  </button>
                                )}

                              {isMe && (
                                <button
                                  onClick={() =>
                                    unsendMessage(
                                      message._id
                                    )
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-soft text-red-500 text-left"
                                >
                                  <Trash2 size={13} />
                                  Unsend
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  deleteForMe(
                                    message._id
                                  )
                                }
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-soft text-left"
                              >
                                <X size={13} />
                                Delete for me
                              </button>

                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              <div ref={bottomRef} />

            </div>

            {/* FILE PREVIEW */}

            {file && (
              <div className="px-4 pt-2">

                <div className="inline-flex items-center gap-2 bg-soft rounded-xl p-2">

                  {preview ? (
                    <img
                      src={preview}
                      className="w-16 h-16 rounded-lg object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-panel flex items-center justify-center text-faint text-xs">
                      {file.type.includes(
                        "video"
                      )
                        ? "VIDEO"
                        : "FILE"}
                    </div>
                  )}

                  <div className="max-w-40">

                    <p className="text-xs font-medium truncate">
                      {file.name}
                    </p>

                    <p className="text-[10px] text-faint">
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);

                      if (
                        fileRef.current
                      ) {
                        fileRef.current.value =
                          "";
                      }
                    }}
                    className="p-1 rounded-full hover:bg-panel text-faint"
                  >
                    <X size={14} />
                  </button>

                </div>

              </div>
            )}

            {/* EDITING */}

            {editingId && (
              <div className="px-4 pt-2 flex items-center gap-2 text-xs text-faint">

                <Pencil size={12} />

                <span>
                  Editing message
                </span>

                <button
                  onClick={
                    cancelEdit
                  }
                  className="text-brand-pink font-semibold"
                >
                  Cancel
                </button>

              </div>
            )}

            {/* INPUT */}

            <form
              onSubmit={send}
              className="flex items-center gap-1 px-3 sm:px-4 py-3 border-t border-line bg-panel relative"
            >

              <button
                type="button"
                onClick={() =>
                  setShowEmoji(
                    (v) => !v
                  )
                }
                disabled={
                  isRecording
                }
                className="p-2 rounded-full hover:bg-soft text-faint shrink-0"
              >
                <Smile size={19} />
              </button>

              {showEmoji && (
                <EmojiPicker
                  onSelect={
                    selectEmoji
                  }
                  onClose={() =>
                    setShowEmoji(
                      false
                    )
                  }
                />
              )}

              {!editingId && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      fileRef.current?.click()
                    }
                    disabled={
                      isRecording
                    }
                    className="p-2 rounded-full hover:bg-soft text-faint shrink-0"
                    title="Attach"
                  >
                    <ImagePlus size={19} />
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    onChange={
                      handleFile
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      isRecording
                        ? stopRecording
                        : startRecording
                    }
                    className={`p-2 rounded-full shrink-0 transition ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "hover:bg-soft text-faint"
                    }`}
                    title={
                      isRecording
                        ? "Stop"
                        : "Voice message"
                    }
                  >
                    {isRecording ? (
                      <Square size={17} />
                    ) : (
                      <Mic size={19} />
                    )}
                  </button>
                </>
              )}

              {isRecording ? (
                <div className="flex-1 bg-soft rounded-full px-4 py-2.5 flex items-center gap-2 text-sm min-w-0">

                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />

                  <span className="text-faint">
                    Recording
                  </span>

                  <span className="font-semibold ml-auto">
                    {formatRecordingTime(
                      recordingTime
                    )}
                  </span>

                </div>
              ) : (
                <input
                  value={text}
                  onChange={(e) =>
                    setText(
                      e.target.value
                    )
                  }
                  placeholder={
                    editingId
                      ? "Edit message..."
                      : active.type ===
                        "group"
                      ? `Message ${active.name}...`
                      : "Message..."
                  }
                  className="flex-1 min-w-0 bg-soft rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-pink/20"
                />
              )}

              {!isRecording && (
                <button
                  type="submit"
                  disabled={
                    !text.trim() &&
                    !file
                  }
                  className="p-2 rounded-full text-brand-pink hover:bg-soft disabled:opacity-30 shrink-0"
                >
                  {editingId ? (
                    <Check size={19} />
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              )}

            </form>
          </>
        ) : (

          <div className="flex-1 flex items-center justify-center">

            <div className="text-center px-6">

              <div className="w-16 h-16 rounded-full bg-soft flex items-center justify-center mx-auto mb-4">
                <Send
                  size={25}
                  className="text-faint"
                />
              </div>

              <h2 className="text-base font-semibold">
                Your messages
              </h2>

              <p className="text-xs text-faint mt-1 max-w-xs">
                Select a conversation or group to start chatting.
              </p>

              <button
                onClick={
                  openNewGroup
                }
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-pink text-white text-xs font-semibold"
              >
                <Users size={15} />
                Create group
              </button>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}