export default {
  common: {
    TITLE: "Finwall",
    BUTTON: {
      UNDO: "Undo",
      REDO: "Redo",
      SAVE: "Save",
      CANCEL: "Cancel",
    },
    MESSAGE: {
      PROCESSING: "Processing...",
    },
    settings: {
      TITLE: "Settings",
      SUBTITLE:
        "Manage your profile, display preferences, and account security.",
      BACK: "Back",
      GROUPS: {
        GENERAL: "General",
      },
      PAGES: {
        PROFILE: "Profile",
        PROFILE_DESC: "Update your name, email, and profile photo.",
        PREFERENCES: "Preferences",
        PREFERENCES_DESC: "Adjust the interface theme and language.",
        SECURITY: "Security & Sessions",
        SECURITY_DESC: "Manage your password and signed-in devices.",
      },
      TABS: {
        PROFILE: "Profile",
        PREFERENCES: "Preferences",
        SECURITY: "Security & Sessions",
      },
    },
    navigation: {
      BREADCRUMB_LABEL: "Breadcrumb",
      MENU_MAIN: "Main Menu",
      MORE: "More",
      CLOSE: "Close",
      SEARCH: "Search",
      NOTIFICATIONS: "Notifications",
      DASHBOARD: "Dashboard",
      ACCOUNTS: "Accounts",
      TRANSACTIONS: "Transactions",
      REPORTS: "Reports & Analytics",
      MENU_TEAM: "Settings & Team",
      MEMBERS: "Team Members",
      WORKSPACE_SETTINGS: "Workspace Settings",
      BILLING: "Billing & Subscription",
      HELP: "Help",
      LOGOUT: "Sign out",
      LOGGING_OUT: "Signing out...",
    },
    error: {
      "404": "Page Not Found",
      "404_DESC":
        "Sorry, the page or path you are looking for does not exist or is invalid. Please check your URL.",
      BACK_TO_HOME: "Back to Home",
    },
  },
  notification: {
    TITLE: {
      SUCCESS: "Success",
      WARNING: "Warning",
      INFO: "Information",
      ERROR: "Failed",
    },
    BODY: {
      SUCCESS: "{action} successfully!",
      ERROR: "Something went wrong",
    },
  },
  accountmenu: {
    USER_FALLBACK: "User",
    THEME_LIGHT: "Light Theme",
    THEME_DARK: "Dark Theme",
    SETTINGS: "Settings",
    HELP: "Help & FAQ",
  },
  workspace: {
    TOGGLE_PANEL: "Toggle accounts panel",
    NO_WORKSPACE: "Select Workspace",
    LIST_TITLE: "Your Workspaces",
    EMPTY: "No workspaces yet.",
    CREATE_NEW: "Create new workspace",
    JOIN: "Join with code",
    RETRY: "Try again",
    SWITCH_SUCCESS_TITLE: "Workspace switched",
    SWITCH_SUCCESS_MESSAGE: 'Now in "{name}".',
    SWITCHING: "Switching workspace...",
    PLEASE_WAIT: "Please wait a moment...",
  },
} as const;
