// =====================================================================
//  Al-Nukhba Card Portal — settings
//  Fill these in after following SETUP.md. Nothing here is secret:
//  these IDs are safe to publish on GitHub.
//
//  While clientId or tenantId is empty, the portal runs in DEMO MODE
//  (simulated sign-in, data kept in the browser only).
// =====================================================================
window.NUKHBA_CONFIG = {

  // --- Microsoft Entra ID (SETUP.md, Step 2) -------------------------
  tenantId: "7571e491-9c53-4562-a9b1-e1b10915387e",   // Directory (tenant) ID
  clientId: "de2bca46-486e-4760-b2e8-b44569f96427",   // Application (client) ID of "Al-Nukhba Portal"

  // Exact address of this site, with the trailing slash.
  // Must match the Redirect URI in the app registration.
  redirectUri: "https://mdsirajudeen.github.io/alnukhba-portal/",

  // App role values (SETUP.md, Step 2.4) — keep as is unless you renamed them
  roles: {
    staff: "Portal.GlobeMed",
    it: "Portal.IT"
  },

  // --- SharePoint list (SETUP.md, Step 1) ----------------------------
  // Recommended: paste the IDs (SETUP.md, Step 1.6).
  siteId: "",              // e.g. "kuwaithospital.sharepoint.com,1111-...,2222-..."
  listId: "",              // e.g. "3333-...."

  // Used only if siteId / listId above are empty:
  siteHostname: "kuwaithospital.sharepoint.com",
  sitePath: "/sites/AlNukhba",
  listName: "AlNukhba Registrations",

  // --- Optional ------------------------------------------------------
  supportText: "",         // e.g. "Need help? Contact Kuwait Hospital IT."
  demoMode: false          // true = force demo mode even when IDs are filled in
};
