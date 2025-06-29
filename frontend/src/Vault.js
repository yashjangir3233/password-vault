
import { useEffect, useState } from "react"
import API from "./api"

export default function Vault() {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ site: "", username: "", password: "", notes: "", masterPassword: "" })
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState("")
  const [revealed, setRevealed] = useState({})
  const [revealedNotes, setRevealedNotes] = useState({})
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showRevealMasterPasswordInput, setShowRevealMasterPasswordInput] = useState(false)
  const [currentRevealId, setCurrentRevealId] = useState(null)
  const [revealMasterPasswordInput, setRevealMasterPasswordInput] = useState("")
  const [copiedEntryId, setCopiedEntryId] = useState(null)
  const [actionAfterReveal, setActionAfterReveal] = useState(null)
  const [showEditMasterPasswordModal, setShowEditMasterPasswordModal] = useState(false)
  const [currentEntryToEdit, setCurrentEntryToEdit] = useState(null)
  const [editMasterPasswordAttempt, setEditMasterPasswordAttempt] = useState("")
  const [editPasswordError, setEditPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showMasterPassword, setShowMasterPassword] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [isPasswordCopied, setIsPasswordCopied] = useState(false)
  const [showRevealPassword, setShowRevealPassword] = useState(false)
  const [pinnedEntries, setPinnedEntries] = useState(new Set())

  // Import/Export states
  const [showImportExportModal, setShowImportExportModal] = useState(false)
  const [importExportMode, setImportExportMode] = useState("export") // "import" or "export"
  const [importFile, setImportFile] = useState(null)
  const [exportMasterPassword, setExportMasterPassword] = useState("")
  const [importMasterPassword, setImportMasterPassword] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchVault()
    // Load pinned entries from localStorage
    const saved = localStorage.getItem("pinnedEntries")
    if (saved) {
      setPinnedEntries(new Set(JSON.parse(saved)))
    }
  }, [])

  // Save pinned entries to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("pinnedEntries", JSON.stringify([...pinnedEntries]))
  }, [pinnedEntries])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("pinnedEntries")
    window.location.reload()
  }

  function generatePassword() {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-="
    let password = ""
    for (let i = 0, n = charset.length; i < 16; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n))
    }
    setForm({ ...form, password })
    setShowPassword(true)
  }

  async function copyGeneratedPassword() {
    if (!form.password) return
    try {
      await navigator.clipboard.writeText(form.password)
      setIsPasswordCopied(true)
      setTimeout(() => setIsPasswordCopied(false), 2000)
    } catch (error) {
      setErrorMessage("Failed to copy password.")
    }
  }

  async function fetchVault() {
    try {
      const res = await API.get("/vault")
      setEntries(res.data)
      setErrorMessage("")
    } catch (error) {
      setErrorMessage("Failed to fetch vault entries.")
    }
  }

  // async function handleSubmit(e) {
  //   e.preventDefault()
  //   if (!form.site || !form.username || !form.password || !form.masterPassword) {
  //     setErrorMessage("Site, username, password, and master password are required.")
  //     return
  //   }

  //   try {
  //     if (editId) {
  //       await API.put(`/vault/${editId}`, form)
  //       setSuccessMessage("Entry updated successfully!")
  //     } else {
  //       await API.post("/vault/add", form)
  //       setSuccessMessage("Entry added successfully!")
  //     }
  //     setForm({ site: "", username: "", password: "", notes: "", masterPassword: "" })
  //     setEditId(null)
  //     fetchVault()
  //     setErrorMessage("")
  //   } catch (error) {
  //     setErrorMessage("Failed to save entry. Check your master password.")
  //   }
  // }

  async function handleSubmit(e) {
  e.preventDefault();
  if (!form.site || !form.username || !form.password || !form.masterPassword) {
    setErrorMessage("Site, username, password, and master password are required.");
    return;
  }

  try {
    if (editId) {
      await API.put(`/vault/${editId}`, form);
      setSuccessMessage("Entry updated successfully!");
    } else {
      await API.post("/vault/add", form);
      setSuccessMessage("Entry added successfully!");
    }
    setForm({ site: "", username: "", password: "", notes: "", masterPassword: "" });
    setEditId(null);
    fetchVault();
    setErrorMessage("");
  } catch (error) {
    setErrorMessage("Failed to save entry. Check your master password.");
  }
}

  function togglePin(entryId) {
    const newPinned = new Set(pinnedEntries)
    if (newPinned.has(entryId)) {
      newPinned.delete(entryId)
    } else {
      newPinned.add(entryId)
    }
    setPinnedEntries(newPinned)
  }

  // function startEdit(entry) {
  //   setCurrentEntryToEdit(entry)
  //   setShowEditMasterPasswordModal(true)
  //   setEditMasterPasswordAttempt("")
  //   setEditPasswordError("")
  //   setErrorMessage("")
  //   window.scrollTo({ top: 0, behavior: "smooth" })
  // }
  function startEdit(entry) {
  setCurrentEntryToEdit(entry);
  setShowEditMasterPasswordModal(true);
  setEditMasterPasswordAttempt("");
  setEditPasswordError("");
  setErrorMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

  // async function handleEditMasterPasswordVerification() {
  //   if (!editMasterPasswordAttempt) {
  //     setEditPasswordError("Master password cannot be empty.")
  //     return
  //   }

  //   try {
  //     const res = await API.post(`/vault/decrypt/${currentEntryToEdit._id}`, {
  //       masterPassword: editMasterPasswordAttempt,
  //     })
  //     setForm({
  //       site: currentEntryToEdit.site,
  //       username: currentEntryToEdit.username,
  //       password: res.data.password,
  //       notes: res.data.notes || "",
  //       masterPassword: "",
  //     })
  //     setEditId(currentEntryToEdit._id)
  //     setShowEditMasterPasswordModal(false)
  //     setCurrentEntryToEdit(null)
  //     setEditMasterPasswordAttempt("")
  //     setEditPasswordError("")
  //     setErrorMessage("")
  //   } catch (error) {
  //     setEditPasswordError("Incorrect master password for editing.")
  //   }
  // }
  async function handleEditMasterPasswordVerification() {
  if (!editMasterPasswordAttempt) {
    setEditPasswordError("Master password cannot be empty.");
    return;
  }

  try {
    const res = await API.post(`/vault/decrypt/${currentEntryToEdit._id}`, {
      masterPassword: editMasterPasswordAttempt,
    });
    setForm({
      site: currentEntryToEdit.site,
      username: currentEntryToEdit.username,
      password: res.data.password,
      notes: res.data.notes || "",
      masterPassword: "",
    });
    setEditId(currentEntryToEdit._id);
    setShowEditMasterPasswordModal(false);
    setCurrentEntryToEdit(null);
    setEditMasterPasswordAttempt("");
    setEditPasswordError("");
    setErrorMessage("");
  } catch (error) {
    setEditPasswordError("Incorrect master password for editing.");
  }
}

  async function deleteEntry(id) {
    try {
      await API.delete(`/vault/${id}`)
      // Remove from pinned if it was pinned
      const newPinned = new Set(pinnedEntries)
      newPinned.delete(id)
      setPinnedEntries(newPinned)
      fetchVault()
      setSuccessMessage("Entry deleted successfully!")
      setErrorMessage("")
    } catch (error) {
      setErrorMessage("Failed to delete entry.")
    }
  }

  function revealPassword(id) {
    setCurrentRevealId(id)
    setShowRevealMasterPasswordInput(true)
    setRevealMasterPasswordInput("")
    setErrorMessage("")
    setActionAfterReveal({ type: "password", entryId: id })
  }

  function revealNotes(id) {
    setCurrentRevealId(id)
    setShowRevealMasterPasswordInput(true)
    setRevealMasterPasswordInput("")
    setErrorMessage("")
    setActionAfterReveal({ type: "notes", entryId: id })
  }

  async function handleRevealMasterPasswordSubmit() {
    if (!revealMasterPasswordInput) {
      setErrorMessage("Master password cannot be empty.")
      return
    }

    try {
      const res = await API.post(`/vault/decrypt/${currentRevealId}`, { masterPassword: revealMasterPasswordInput })

      if (actionAfterReveal.type === "password") {
        const password = res.data.password
        setRevealed({ ...revealed, [currentRevealId]: password })

        if (actionAfterReveal.action === "copy") {
          await navigator.clipboard.writeText(password)
          setCopiedEntryId(currentRevealId)
          setTimeout(() => setCopiedEntryId(null), 2000)
        }
      } else if (actionAfterReveal.type === "notes") {
        const notes = res.data.notes || ""
        setRevealedNotes({ ...revealedNotes, [currentRevealId]: notes })
      }

      setShowRevealMasterPasswordInput(false)
      setRevealMasterPasswordInput("")
      setErrorMessage("")
      setActionAfterReveal(null)
    } catch (error) {
      setErrorMessage("Incorrect master password.")
      setActionAfterReveal(null)
    }
  }

  async function copyToClipboard(id) {
    if (revealed[id]) {
      try {
        await navigator.clipboard.writeText(revealed[id])
        setCopiedEntryId(id)
        setTimeout(() => setCopiedEntryId(null), 2000)
        setErrorMessage("")
      } catch (error) {
        setErrorMessage("Failed to copy password.")
      }
    } else {
      setActionAfterReveal({ type: "password", action: "copy", entryId: id })
      setCurrentRevealId(id)
      setShowRevealMasterPasswordInput(true)
      setRevealMasterPasswordInput("")
      setErrorMessage("")
    }
  }

  // Import/Export Functions
  async function handleExport() {
    if (!exportMasterPassword) {
      setErrorMessage("Master password is required for export.")
      return
    }

    setIsProcessing(true)
    try {
      const res = await API.post("/vault/export", { masterPassword: exportMasterPassword })

      // Create CSV content
      const csvContent = [
        "Site,Username,Password,Notes",
        ...res.data.map((entry) => `"${entry.site}","${entry.username}","${entry.password}","${entry.notes || ""}"`),
      ].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `vault-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setSuccessMessage("Vault exported successfully!")
      setShowImportExportModal(false)
      setExportMasterPassword("")
    } catch (error) {
      setErrorMessage("Failed to export vault. Check your master password.")
    }
    setIsProcessing(false)
  }

  async function handleImport() {
    if (!importFile || !importMasterPassword) {
      setErrorMessage("Please select a file and enter your master password.")
      return
    }

    setIsProcessing(true)
    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

      if (!headers.includes("Site") || !headers.includes("Username") || !headers.includes("Password")) {
        throw new Error("Invalid CSV format. Required columns: Site, Username, Password")
      }

      const entries = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())
        if (values.length >= 3) {
          entries.push({
            site: values[0],
            username: values[1],
            password: values[2],
            notes: values[3] || "",
            masterPassword: importMasterPassword,
          })
        }
      }

      // Import entries one by one
      let successCount = 0
      for (const entry of entries) {
        try {
          await API.post("/vault/add", entry)
          successCount++
        } catch (error) {
          console.error("Failed to import entry:", entry.site)
        }
      }

      fetchVault()
      setSuccessMessage(`Successfully imported ${successCount} entries!`)
      setShowImportExportModal(false)
      setImportFile(null)
      setImportMasterPassword("")
    } catch (error) {
      setErrorMessage("Failed to import vault. Check your file format and master password.")
    }
    setIsProcessing(false)
  }

  const filtered = entries.filter(
    (e) =>
      e.site.toLowerCase().includes(search.toLowerCase()) || e.username.toLowerCase().includes(search.toLowerCase()),
  )

  // Sort entries: pinned first, then alphabetically
  const sortedEntries = filtered.sort((a, b) => {
    const aIsPinned = pinnedEntries.has(a._id)
    const bIsPinned = pinnedEntries.has(b._id)

    if (aIsPinned && !bIsPinned) return -1
    if (!aIsPinned && bIsPinned) return 1
    return a.site.localeCompare(b.site)
  })

  return (
    <div
      style={{
        backgroundColor: "#0a0a0a",
        color: "#e8e8e8",
        minHeight: "100vh",
        padding: "0",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: "1.6",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          padding: "16px 20px",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              color: "#ffffff",
              margin: "0",
              fontSize: "clamp(20px, 4vw, 28px)",
              fontWeight: "700",
              letterSpacing: "-0.5px",
            }}
          >
            🔐 Vault
          </h1>
          <p
            style={{
              color: "#888",
              margin: "4px 0 0 0",
              fontSize: "clamp(12px, 2.5vw, 14px)",
            }}
          >
            Secure password manager
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setShowImportExportModal(true)
              setImportExportMode("import")
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import
          </button>

          <button
            onClick={() => {
              setShowImportExportModal(true)
              setImportExportMode("export")
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Export
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              color: "#ffffff",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(220, 38, 38, 0.4)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: "clamp(16px, 4vw, 32px)", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Messages */}
        {errorMessage && (
          <div
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              color: "#ffffff",
              padding: "16px 20px",
              borderRadius: "12px",
              marginBottom: "24px",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              fontWeight: "500",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              padding: "16px 20px",
              borderRadius: "12px",
              marginBottom: "24px",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              fontWeight: "500",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Add/Edit Form */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            padding: "clamp(20px, 4vw, 32px)",
            borderRadius: "16px",
            marginBottom: "32px",
            border: "1px solid #333",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <h2
            style={{
              color: "#ffffff",
              margin: "0 0 24px 0",
              fontSize: "clamp(16px, 3vw, 20px)",
              fontWeight: "600",
            }}
          >
            {editId ? "Edit Entry" : "Add New Entry"}
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <input
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #444",
                  backgroundColor: "#2a2a2a",
                  color: "#e8e8e8",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                placeholder="Website or Service"
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />
              <input
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #444",
                  backgroundColor: "#2a2a2a",
                  color: "#e8e8e8",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                placeholder="Username or Email"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "stretch", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
                <input
                  style={{
                    padding: "16px 50px 16px 16px",
                    borderRadius: "12px",
                    border: "1px solid #444",
                    backgroundColor: "#2a2a2a",
                    color: "#e8e8e8",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    fontWeight: "500",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#444")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#888",
                    padding: "8px",
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.color = "#e8e8e8")}
                  onMouseOut={(e) => (e.target.style.color = "#888")}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-2.94m5.13-5.13A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 2.94m-5.13 5.13L2 22l2-2" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={generatePassword}
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
              >
                Generate
              </button>

              <button
                type="button"
                onClick={copyGeneratedPassword}
                disabled={!form.password}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: form.password ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "#444",
                  color: "#ffffff",
                  cursor: form.password ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => {
                  if (form.password) e.target.style.transform = "translateY(-1px)"
                }}
                onMouseOut={(e) => {
                  if (form.password) e.target.style.transform = "translateY(0)"
                }}
              >
                {isPasswordCopied ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            {/* Notes Section */}
            <div style={{ position: "relative" }}>
              <textarea
                style={{
                  padding: "16px 50px 16px 16px",
                  borderRadius: "12px",
                  border: "1px solid #444",
                  backgroundColor: "#2a2a2a",
                  color: "#e8e8e8",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "500",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  outline: "none",
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                placeholder="Secure notes (2FA codes, recovery keys, etc.)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                  padding: "8px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.color = "#e8e8e8")}
                onMouseOut={(e) => (e.target.style.color = "#888")}
                title="Toggle notes visibility"
              >
                {showNotes ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-2.94m5.13-5.13A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 2.94m-5.13 5.13L2 22l2-2" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <input
                style={{
                  padding: "16px 50px 16px 16px",
                  borderRadius: "12px",
                  border: "1px solid #444",
                  backgroundColor: "#2a2a2a",
                  color: "#e8e8e8",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "500",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                type={showMasterPassword ? "text" : "password"}
                placeholder="Master Password"
                value={form.masterPassword}
                onChange={(e) => setForm({ ...form, masterPassword: e.target.value })}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />
              <button
                type="button"
                onClick={() => setShowMasterPassword(!showMasterPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                  padding: "8px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.color = "#e8e8e8")}
                onMouseOut={(e) => (e.target.style.color = "#888")}
              >
                {showMasterPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-2.94m5.13-5.13A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 2.94m-5.13 5.13L2 22l2-2" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              style={{
                padding: "16px 24px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                fontSize: "clamp(14px, 3vw, 16px)",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-1px)"
                e.target.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)"
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)"
              }}
            >
              {editId ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Update Entry
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Entry
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <input
            style={{
              padding: "16px 16px 16px 48px",
              borderRadius: "12px",
              border: "1px solid #444",
              backgroundColor: "#1a1a1a",
              color: "#e8e8e8",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              fontWeight: "500",
              width: "100%",
              boxSizing: "border-box",
              transition: "all 0.2s ease",
              outline: "none",
            }}
            placeholder="Search your vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#444")}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Entries List */}
        <div style={{ display: "grid", gap: "16px" }}>
          {sortedEntries.map((entry) => (
            <div
              key={entry._id}
              style={{
                background: pinnedEntries.has(entry._id)
                  ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
                  : "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
                padding: "clamp(16px, 4vw, 24px)",
                borderRadius: "16px",
                border: pinnedEntries.has(entry._id) ? "1px solid #4338ca" : "1px solid #333",
                boxShadow: pinnedEntries.has(entry._id)
                  ? "0 8px 32px rgba(67, 56, 202, 0.2)"
                  : "0 4px 16px rgba(0, 0, 0, 0.2)",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              {/* Pin indicator */}
              {pinnedEntries.has(entry._id) && (
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "rgba(99, 102, 241, 0.2)",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    fontSize: "clamp(10px, 2vw, 12px)",
                    color: "#a5b4fc",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  📌 Pinned
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                  paddingRight: pinnedEntries.has(entry._id) ? "80px" : "0",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ minWidth: "0", flex: "1" }}>
                  <h3
                    style={{
                      color: "#ffffff",
                      margin: "0 0 4px 0",
                      fontSize: "clamp(14px, 3vw, 18px)",
                      fontWeight: "600",
                      wordBreak: "break-word",
                    }}
                  >
                    {entry.site}
                  </h3>
                  <p
                    style={{
                      color: "#888",
                      margin: "0",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      wordBreak: "break-word",
                    }}
                  >
                    {entry.username}
                  </p>
                </div>
              </div>

              {/* Revealed Password */}
              {revealed[entry._id] && (
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #444",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(10px, 2vw, 12px)",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    Password:
                  </div>
                  <code
                    style={{
                      color: "#e8e8e8",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      fontFamily: "Monaco, Consolas, monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {revealed[entry._id]}
                  </code>
                </div>
              )}

              {/* Revealed Notes */}
              {revealedNotes[entry._id] && (
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #444",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(10px, 2vw, 12px)",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    Notes:
                  </div>
                  <div
                    style={{
                      color: "#e8e8e8",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {revealedNotes[entry._id] || "No notes"}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => togglePin(entry._id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: pinnedEntries.has(entry._id)
                      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      : "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "clamp(10px, 2vw, 12px)",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                  onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                  title={pinnedEntries.has(entry._id) ? "Unpin" : "Pin"}
                >
                  📌 {pinnedEntries.has(entry._id) ? "Unpin" : "Pin"}
                </button>

                <button
                  onClick={() => startEdit(entry)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "clamp(10px, 2vw, 12px)",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.2)"
                    e.target.style.transform = "translateY(-1px)"
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.1)"
                    e.target.style.transform = "translateY(0)"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Edit
                </button>

                <button
                  onClick={() => deleteEntry(entry._id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "clamp(10px, 2vw, 12px)",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                  onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  Delete
                </button>

                <button
                  onClick={() => revealPassword(entry._id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "clamp(10px, 2vw, 12px)",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                  onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Reveal
                </button>

                <button
                  onClick={() => copyToClipboard(entry._id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "clamp(10px, 2vw, 12px)",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                  onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                >
                  {copiedEntryId === entry._id ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>

                <button
                  onClick={() => revealNotes(entry._id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "clamp(10px, 2vw, 12px)",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                  onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Notes
                </button>
              </div>
            </div>
          ))}
        </div>

        {sortedEntries.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "clamp(32px, 8vw, 48px) 24px",
              color: "#888",
            }}
          >
            <div style={{ fontSize: "clamp(32px, 8vw, 48px)", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ color: "#ffffff", marginBottom: "8px", fontSize: "clamp(16px, 3vw, 20px)" }}>
              No entries found
            </h3>
            <p style={{ fontSize: "clamp(12px, 2.5vw, 14px)" }}>Try adjusting your search or add a new entry above.</p>
          </div>
        )}
      </div>

      {/* Import/Export Modal */}
      {showImportExportModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "1000",
            backdropFilter: "blur(4px)",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
              padding: "clamp(24px, 6vw, 32px)",
              borderRadius: "16px",
              border: "1px solid #333",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                color: "#ffffff",
                marginBottom: "16px",
                fontSize: "clamp(16px, 4vw, 20px)",
                fontWeight: "600",
              }}
            >
              {importExportMode === "export" ? "Export Vault" : "Import Vault"}
            </h3>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <button
                  onClick={() => setImportExportMode("export")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      importExportMode === "export"
                        ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                        : "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  Export
                </button>
                <button
                  onClick={() => setImportExportMode("import")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      importExportMode === "import"
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  Import
                </button>
              </div>
            </div>

            {importExportMode === "export" ? (
              <div>
                <p
                  style={{
                    color: "#888",
                    marginBottom: "24px",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    lineHeight: "1.5",
                  }}
                >
                  Export your vault data to a CSV file. Your master password is required to decrypt the data.
                </p>

                <input
                  type="password"
                  placeholder="Master Password"
                  value={exportMasterPassword}
                  onChange={(e) => setExportMasterPassword(e.target.value)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #444",
                    backgroundColor: "#2a2a2a",
                    color: "#e8e8e8",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    fontWeight: "500",
                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: "24px",
                    outline: "none",
                  }}
                />

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      setShowImportExportModal(false)
                      setExportMasterPassword("")
                    }}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "none",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
                    onMouseOut={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.1)")}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isProcessing || !exportMasterPassword}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "none",
                      background:
                        isProcessing || !exportMasterPassword
                          ? "#444"
                          : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      color: "#ffffff",
                      cursor: isProcessing || !exportMasterPassword ? "not-allowed" : "pointer",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseOver={(e) => {
                      if (!isProcessing && exportMasterPassword) e.target.style.transform = "translateY(-1px)"
                    }}
                    onMouseOut={(e) => {
                      if (!isProcessing && exportMasterPassword) e.target.style.transform = "translateY(0)"
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid #ffffff",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p
                  style={{
                    color: "#888",
                    marginBottom: "24px",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    lineHeight: "1.5",
                  }}
                >
                  Import vault data from a CSV file. The CSV should have columns: Site, Username, Password, Notes
                  (optional).
                </p>

                <div
                  style={{
                    border: "2px dashed #444",
                    borderRadius: "12px",
                    padding: "24px",
                    textAlign: "center",
                    marginBottom: "20px",
                    backgroundColor: "#2a2a2a",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    style={{
                      display: "none",
                    }}
                    id="csvFileInput"
                  />
                  <label
                    htmlFor="csvFileInput"
                    style={{
                      cursor: "pointer",
                      display: "block",
                    }}
                  >
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                      style={{ marginBottom: "12px" }}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "clamp(14px, 3vw, 16px)",
                        fontWeight: "600",
                        marginBottom: "4px",
                      }}
                    >
                      {importFile ? importFile.name : "Choose CSV File"}
                    </div>
                    <div
                      style={{
                        color: "#888",
                        fontSize: "clamp(12px, 2.5vw, 14px)",
                      }}
                    >
                      Click to browse or drag and drop
                    </div>
                  </label>
                </div>

                <input
                  type="password"
                  placeholder="Master Password"
                  value={importMasterPassword}
                  onChange={(e) => setImportMasterPassword(e.target.value)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #444",
                    backgroundColor: "#2a2a2a",
                    color: "#e8e8e8",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    fontWeight: "500",
                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: "24px",
                    outline: "none",
                  }}
                />

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      setShowImportExportModal(false)
                      setImportFile(null)
                      setImportMasterPassword("")
                    }}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "none",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
                    onMouseOut={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.1)")}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isProcessing || !importFile || !importMasterPassword}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "none",
                      background:
                        isProcessing || !importFile || !importMasterPassword
                          ? "#444"
                          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      cursor: isProcessing || !importFile || !importMasterPassword ? "not-allowed" : "pointer",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseOver={(e) => {
                      if (!isProcessing && importFile && importMasterPassword)
                        e.target.style.transform = "translateY(-1px)"
                    }}
                    onMouseOut={(e) => {
                      if (!isProcessing && importFile && importMasterPassword)
                        e.target.style.transform = "translateY(0)"
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid #ffffff",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Importing...
                      </>
                    ) : (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Import CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reveal Password Modal */}
      {showRevealMasterPasswordInput && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "1000",
            backdropFilter: "blur(4px)",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
              padding: "clamp(24px, 6vw, 32px)",
              borderRadius: "16px",
              border: "1px solid #333",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <h3
              style={{
                color: "#ffffff",
                marginBottom: "16px",
                fontSize: "clamp(16px, 4vw, 20px)",
                fontWeight: "600",
              }}
            >
              Enter Master Password
            </h3>
            <p
              style={{
                color: "#888",
                marginBottom: "24px",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              Please enter your master password to{" "}
              {actionAfterReveal?.type === "notes" ? "reveal notes" : "reveal password"}.
            </p>

            {errorMessage && (
              <div
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                }}
              >
                {errorMessage}
              </div>
            )}

            <div style={{ position: "relative", marginBottom: "24px" }}>
              <input
                type={showRevealPassword ? "text" : "password"}
                placeholder="Master Password"
                value={revealMasterPasswordInput}
                onChange={(e) => setRevealMasterPasswordInput(e.target.value)}
                style={{
                  padding: "16px 50px 16px 16px",
                  borderRadius: "12px",
                  border: "1px solid #444",
                  backgroundColor: "#2a2a2a",
                  color: "#e8e8e8",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "500",
                  width: "100%",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                onKeyPress={(e) => e.key === "Enter" && handleRevealMasterPasswordSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowRevealPassword(!showRevealPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                  padding: "8px",
                }}
              >
                {showRevealPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-2.94m5.13-5.13A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 2.94m-5.13 5.13L2 22l2-2" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setShowRevealMasterPasswordInput(false)
                  setActionAfterReveal(null)
                  setErrorMessage("")
                }}
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
                onMouseOut={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.1)")}
              >
                Cancel
              </button>
              <button
                onClick={handleRevealMasterPasswordSubmit}
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Master Password Modal */}
      {showEditMasterPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "1000",
            backdropFilter: "blur(4px)",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
              padding: "clamp(24px, 6vw, 32px)",
              borderRadius: "16px",
              border: "1px solid #333",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <h3
              style={{
                color: "#ffffff",
                marginBottom: "16px",
                fontSize: "clamp(16px, 4vw, 20px)",
                fontWeight: "600",
              }}
            >
              Verify Master Password
            </h3>
            <p
              style={{
                color: "#888",
                marginBottom: "24px",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              Please enter your master password to edit this entry.
            </p>

            {editPasswordError && (
              <div
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                }}
              >
                {editPasswordError}
              </div>
            )}

            <input
              type="password"
              placeholder="Master Password"
              value={editMasterPasswordAttempt}
              onChange={(e) => setEditMasterPasswordAttempt(e.target.value)}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #444",
                backgroundColor: "#2a2a2a",
                color: "#e8e8e8",
                fontSize: "clamp(12px, 2.5vw, 14px)",
                fontWeight: "500",
                width: "100%",
                boxSizing: "border-box",
                marginBottom: "24px",
                outline: "none",
              }}
              onKeyPress={(e) => e.key === "Enter" && handleEditMasterPasswordVerification()}
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setShowEditMasterPasswordModal(false)
                  setEditPasswordError("")
                }}
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
                onMouseOut={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.1)")}
              >
                Cancel
              </button>
              <button
                onClick={handleEditMasterPasswordVerification}
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
