export const fr = {
  // Onboarding
  walletSelector: {
    title: "Vos messages.\nVotre confidentialité.",
    subtitle:
      "Messagerie décentralisée,\nchiffrée de bout en bout et détenue par vous.",
    converseAccount: {
      title: "COMPTES CONVERSE",
      connectViaPhone: "Se connecter via téléphone",
      createEphemeral: "Créer un compte éphémère",
    },
    installedApps: {
      title: "APPLICATIONS INSTALLÉES",
      connectWallet: "Connecter {{walletName}}",
    },
    connectionOptions: {
      title: "OPTIONS DE CONNEXION",
      otherOptions: "AUTRES OPTIONS",
      connectExistingWallet: "CONNECTER UN PORTEFEUILLE EXISTANT",
      connectForDevs: "POUR LES DÉVELOPPEURS",
      connectViaBrowserWallet: "Se connecter via un portefeuille de navigateur",
      connectViaDesktop: "Se connecter via un portefeuille sur ordinateur",
      connectViaKey: "Se connecter via une clé",
    },
    popularMobileApps: {
      title: "APPLICATIONS MOBILES POPULAIRES",
    },
    backButton: "Retour",
  },
  privyConnect: {
    title: {
      enterPhone: "Se connecter via\nnuméro de téléphone",
      verifyPhone: "Code de confirmation",
    },
    storedSecurely:
      "Votre numéro de téléphone est stocké de manière sécurisée et uniquement partagé avec Privy afin que vous puissiez vous reconnecter.",
    buttons: {
      continue: "Continuer",
      back: "Retour",
      resendCode: "Renvoyer le code",
    },
    phoneInput: {
      placeholder: "Entrez votre numéro de téléphone",
    },
    otpInput: {
      enterCode: "Entrez le code de confirmation envoyé à",
    },
    errors: {
      invalidPhoneNumber: "Veuillez entrer un numéro de téléphone valide",
      invalidCode:
        "Le code que vous avez entré n'est pas valide, veuillez réessayer",
    },
    resendCodeIn: "Renvoyer le code dans {{seconds}} secondes…",
  },
  createEphemeral: {
    title: "Créer un compte éphémère",
    subtitle:
      "Créez des conversations et des liens sans révéler votre identité, et restez connecté sans partager de données personnelles.",
    disconnect_to_remove:
      "Lorsque vous déconnecterez ce compte, vous supprimerez définitivement ses données de votre appareil.",
    createButton: "Créer",
    backButton: "Retour",
  },
  privateKeyConnect: {
    title: "Se connecter via une clé",
    subtitle:
      "Entrez la clé privée de l'adresse à laquelle vous vous connectez.\n\nVotre clé privée n'est pas stockée.",
    storage: {
      ios: "l’Enclave Sécurisée de votre iPhone",
      android: "le système Android Keystore",
    },
    connectButton: "Se connecter",
    backButton: "Retour",
    privateKeyPlaceholder: "Entrez une clé privée",
    invalidPrivateKey: "Cette clé privée est invalide. Veuillez réessayer.",
  },
  connectViaWallet: {
    sign: "Signer",
    firstSignature: {
      title: "Commencer",
      explanation:
        "La boîte de réception sécurisée que vous possédez.\nConverse est construit sur XMTP, un protocole de messagerie sécurisée open-source.",
    },
    valueProps: {
      e2eEncryption: {
        title: "Chiffré de bout en bout avec MLS",
        subtitle:
          "Cryptographie conforme aux standards de l’IETF offrant le niveau de sécurité de Signal à chaque conversation.",
      },
      ownCommunications: {
        title: "Possédez vos communications — pour toujours",
        subtitle:
          "Vos messages vous appartiennent. Vous les contrôlez entièrement, pas l’application.",
      },
      chatSecurely: {
        title: "Invitez vos amis",
        subtitle:
          "Trouvez des personnes que vous connaissez on-chain ou partagez votre code QR privé avec vos amis.",
      },
    },
    cancel: "Annuler",
    backButton: "Retour",
    alreadyConnected: {
      title: "Déjà connecté",
      message: "Ce compte est déjà connecté à Converse.",
    },
  },
  userProfile: {
    title: {
      profile: "Profil",
    },
    buttons: {
      continue: "Continuer",
      logout: "Se déconnecter de {{address}}",
      cancel: "Annuler",
      addProfilePicture: "Ajouter une photo de profil",
      changeProfilePicture: "Changer la photo de profil",
    },
    inputs: {
      username: {
        placeholder: "Nom d'utilisateur",
      },
      usernameSuffix: ".converse.xyz",
      displayName: {
        placeholder: "Nom d'affichage (optionnel)",
      },
    },
    errors: {
      displayNameLength:
        "Les noms d'affichage doivent comprendre entre 2 et 32 caractères et ne pas inclure d'extensions de nom de domaine",
      usernameAlphanumeric:
        "Votre nom d'utilisateur ne peut contenir que des lettres et des chiffres",
      usernameLength:
        "Votre nom d'utilisateur doit comporter entre 3 et 30 caractères",
    },
    converseProfiles:
      "Réclamez votre identité dans l'espace de noms ENS de Converse. Ce nom sera publiquement consultable.",
    instructions:
      "Réclamez votre identité dans l'espace de noms ENS de Converse. Ce nom sera publiquement consultable.",
    loadingSentences: {
      claimingIdentity: "Réclamation de votre identité",
      connectingENS: "Connexion à ENS",
      confirmingAvailability: "Confirmation de la disponibilité",
      enablingCCIP: "Activation de CCIP",
      registering: "Enregistrement en cours",
      configuringResolver: "Configuration du résolveur hors chaîne",
      wrappingUp: "Finalisation",
    },
    mediaOptions: {
      takePhoto: "Prendre une photo",
      chooseFromLibrary: "Choisir dans la bibliothèque",
      cancel: "Annuler",
    },
  },
  onboarding_error:
    "Une erreur s'est produite lors de votre connexion. Veuillez réessayer.",
  termsText: "En vous connectant, vous acceptez nos",
  termsLink: "conditions générales.",

  // Conversation List
  delete: "Supprimer",
  delete_chat_with: "Supprimer la conversation avec",
  delete_and_block: "Supprimer et bloquer",
  remove: "Retirer",
  remove_and_block_inviter: "Retirer et bloquer l’invitant",
  restore: "Restaurer",
  restore_and_unblock_inviter: "Restaurer et débloquer l’invitant",
  unblock_and_restore: "Débloquer et restaurer",
  cancel: "Annuler",
  back: "Retour",
  view_only: "Afficher uniquement",
  view_and_restore: "Afficher et restaurer",
  view_removed_group_chat: "Afficher le groupe supprimé ?",
  connecting: "Connexion…",
  syncing: "Synchronisation…",
  search_chats: "Rechercher des conversations",
  no_results:
    "Aucun résultat trouvé dans vos conversations existantes. Vous pouvez",
  no_results_start_convo: "commencer une nouvelle conversation",
  new_account: "Nouveau compte",
  add_an_account: "Ajouter un compte",
  group_info: "Informations sur le groupe",
  converse_match_maker: "Converse Match Maker",

  // Requests
  requests: "Demandes",
  clear_all: "Tout effacer",
  clear_confirm:
    "Confirmez-vous ? Cela bloquera tous les comptes actuellement marqués comme demandes.",
  clearing: "Nettoyage",
  you_might_know: "Vous pourriez connaître",
  hidden_requests: "Demandes masquées",
  suggestion_text:
    "Sur la base de votre historique on-chain, nous vous proposons quelques suggestions de personnes que vous pourriez connaître.",
  no_suggestions_text:
    "Vous n'avez actuellement aucune demande de message. Nous ferons des suggestions ici à mesure que vous vous connecterez avec d'autres.",
  hidden_requests_warn:
    "Les demandes contenant des messages potentiellement offensants ou indésirables sont déplacées dans ce dossier.",

  // Conversation
  accept: "Accepter",
  block: "Bloquer",
  decline: "Refuser",
  unblock: "Débloquer",
  if_you_unblock_contact:
    "Si vous débloquez ce contact, il pourra à nouveau vous envoyer des messages.",
  if_you_block_contact:
    "Si vous bloquez ce contact, vous ne recevrez plus de messages de sa part.",
  opening_conversation: "Ouverture de votre conversation",
  conversation_not_found:
    "Nous n'avons pas pu trouver cette conversation. Veuillez réessayer",
  group_not_found:
    "Nous n'avons pas pu trouver ce groupe. Veuillez réessayer ou demander à quelqu'un de vous inviter à ce groupe",
  say_hi: "Dites bonjour",
  do_you_trust_this_contact: "Faites-vous confiance à ce contact ?",
  do_you_want_to_join_this_group: "Souhaitez-vous rejoindre ce groupe ?",
  join_this_group: "Rejoindre ce groupe",
  identity_not_found_title: "Identité introuvable",
  identity_not_found:
    "L'identité {{identity}} est introuvable ou invalide. Veuillez vérifier et réessayer",
  identity_not_found_timeout:
    "La résolution de l'identité {{identity}} a pris trop de temps. Veuillez vérifier votre connexion et réessayer",
  identity_not_yet_xmtp_title: "N'utilise pas encore XMTP",
  identity_not_yet_xmtp:
    "{{identity}} n'utilise pas encore XMTP. Dites-lui de télécharger l'application sur converse.xyz et de se connecter avec son portefeuille",

  attachment_not_found: "Impossible de trouver la pièce jointe",
  // Conversation Context Menu
  pin: "Épingler",
  unpin: "Désépingler",
  mark_as_read: "Marquer comme lu",
  mark_as_unread: "Marquer comme non lu",

  // NewGroupSummary
  group_name: "NOM DU GROUPE",
  group_description: "DESCRIPTION DU GROUPE",
  upload_group_photo_error:
    "Erreur lors du téléchargement de la photo du groupe",
  promote_to_admin_to_manage_group:
    "Après avoir créé le groupe, vous pouvez promouvoir quelqu'un au rang d'administrateur pour gérer les membres et les infos du groupe.",

  // Profile
  remove_from_group: "Retirer du groupe",
  are_you_sure: "Êtes-vous sûr ?",
  promote_to_admin: "Promouvoir au rang d'administrateur",
  send_a_message: "Envoyer un message",
  client_error:
    "Un problème est survenu, veuillez essayer de vous reconnecter.",
  actions: "ACTIONS",
  common_activity: "ACTIVITÉ COMMUNE",
  social: "RÉSEAUX SOCIAUX",
  address: "ADRESSE",
  youre_the_og: "VOUS ÊTES LE PREMIER",
  app_version: "VERSION DE L’APPLICATION",
  security: "SÉCURITÉ",
  xmtp_wrong_signer: "Mauvais portefeuille",
  xmtp_wrong_signer_description:
    "Le portefeuille lié ne possède pas cette identité XMTP. Nous l'avons dissocié, veuillez réessayer.",
  promote_to_super_admin: "Promouvoir au rang de super administrateur",
  revoke_super_admin: "Révoquer le super administrateur",
  revoke_admin: "Révoquer l'administrateur",
  remove_member: "Retirer du groupe",
  invite_more_friends: "Inviter plus d'amis",
  top_up_your_account: "Approvisionner votre compte",
  your_balance_usdc: "Votre solde (USDC)",
  you_parentheses: " (vous)",

  // Context Menu
  reply: "Répondre",
  copy: "Copier",
  share: "Partager",
  share_frame: "Partager le cadre",

  // Attachments
  photo_library: "Bibliothèque de photos",
  camera: "Caméra",

  disconnect: "Se déconnecter",
  disconnect_delete_local_data:
    "Se déconnecter et supprimer les données locales",
  disconnect_this_account: "Se déconnecter de ce compte",
  disconnect_account_description:
    "Vos discussions de groupe seront chiffrées et sauvegardées sur votre appareil jusqu'à ce que vous supprimiez Converse. Vos messages privés seront sauvegardés par le réseau XMTP.",
  your_profile_page: "Votre page de profil",
  copy_wallet_address: "Copier l'adresse du portefeuille",
  turn_on_notifications: "Activer les notifications",
  attachment_message_error_download:
    "Impossible de télécharger la pièce jointe",
  attachment_message_view_in_browser: "Voir dans le navigateur",
  attachment: "Pièce jointe",

  // Reactions
  reacted_to_media: "A réagi {{reactionContent}} à un média",
  reacted_to_transaction: "A réagi {{reactionContent}} à une transaction",
  reacted_to_other: 'A réagi {{reactionContent}} à "{{content}}"',
  removed_reaction_to_attachment: "A retiré la réaction à une pièce jointe",
  removed_reaction_to: 'A retiré la réaction à "{{content}}"',

  // Group Invites
  group_admin_approval:
    "Un administrateur du groupe devra peut-être approuver votre adhésion avant que vous ne puissiez rejoindre.",
  joining: "Rejoindre...",
  join_group: "Rejoindre le groupe",
  group_join_error: "Une erreur s'est produite",
  group_join_invite_invalid: "Cette invitation n'est plus valable",
  group_finished_polling_unsuccessfully:
    "Votre demande a été envoyée. Attendez l'approbation par l’administrateur",
  group_already_joined: "Cette invitation a déjà été acceptée",
  group_invite_default_group_name: "Nouveau groupe",
  open_conversation: "Ouvrir la conversation",

  // Group Overview
  change_profile_picture: "Changer la photo de profil",
  add_profile_picture: "Ajouter une photo de profil",
  add_description: "Ajouter une description",
  restore_group: "Restaurer le groupe",
  remove_group: "Retirer le groupe",
  actions_title: "ACTIONS",
  members_title: "MEMBRES",
  membership_requests_title: "DEMANDES D'ADHÉSION",
  group_invite_link_created_copied: "Lien d'invitation créé et copié !",
  group_invite_link_copied: "Lien d'invitation copié !",
  group_invite_link_deleted: "Lien d'invitation supprimé !",
  add_more_members: "Ajouter plus de membres",
  copy_invite_link: "Copier le lien d'invitation",
  create_invite_link: "Créer un lien d'invitation",
  pending: "En attente",
  approve: "Approuver",
  deny: "Refuser",
  approve_member_to_this_group: "Approuver {{name}} dans ce groupe",

  // New Group
  new_group: {
    add_members: "Ajouter des membres",
    edit_group_info: "Modifier les informations du groupe",
    members_can: "LES MEMBRES PEUVENT",
  },

  new_conversation: {
    create_group: "Créer un groupe",
    back: "Retour",
    create: "Créer",
    add_members: "Ajouter des membres",
    new_conversation: "Nouvelle conversation",
    invite_to_converse: "Invitez-les à Converse",
  },

  // Wallet selector
  no_wallet_detected: "Aucun portefeuille détecté",

  // Profile
  view_removed_chats: "Afficher les conversations supprimées",
  change_or_add_account: "Changer ou ajouter un compte",
  profile: {
    modify_profile: "Modifier le profil",
  },

  // Revocation
  current_installation_revoked: "Déconnecté",
  current_installation_revoked_description:
    "Vous avez été déconnecté de votre compte. Vos discussions de groupe seront supprimées de cet appareil.",
  other_installations_count: "Vous avez {{count}} connexions actives",
  revoke_description:
    "Souhaitez-vous vous déconnecter de toutes les autres sessions ?",
  revoke_done_title: "Terminé",
  revoke_done_description: "{{count}} sessions déconnectées",
  revoke_empty: "Vous n'avez aucune autre session active",
  revoke_others_cta: "Déconnecter les autres",
  revoke_wallet_picker_title: "Déconnecter les autres",
  revoke_wallet_picker_description:
    "Connectez le portefeuille associé à votre compte XMTP : {{wallet}}",

  // Emoji Picker
  choose_reaction: "Choisir une réaction",
  search_emojis: "Rechercher des émojis",
  emoji_picker_all: "Tout",

  // Chat null state
  connectWithYourNetwork: "Trouvez vos amis",
  shareYourQRCode: "Partagez votre code QR",
  moveOrConnect:
    "Déplacez une conversation vers Converse,\nou connectez-vous avec quelqu'un de nouveau.",
  findContacts:
    "Voici quelques contacts recommandés en fonction\nde votre activité on-chain",
  copyShareLink: "Copier le lien de partage",
  alphaTestTitle: "Aidez à façonner l'avenir de Converse !",
  alphaTestDescription:
    "Partagez vos retours et vos idées avec l'équipe Converse et les autres testeurs alpha.",
  joinAlphaGroup: "Rejoindre le groupe VIP Alpha de Converse",
  linkCopied: "Lien copié",

  // Transactional frames
  transactionalFrameConnectWallet:
    "Connectez-vous à une application de portefeuille pour lancer une transaction",
  transaction_failure: "Transaction échouée",
  transaction_pending: "Confirmez dans {{wallet}}",
  transaction_triggering: "Ouverture de {{wallet}}...",
  transaction_triggered: "Votre transaction est en cours d'exécution...",
  transaction_success: "Terminé !",
  transaction_switch_chain:
    "Changez de chaîne pour {{chainName}} dans {{wallet}}",
  transaction_wallet: "Portefeuille",

  // Transaction Simulation
  simulation_pending: "Simulation sécurisée de cette transaction",
  simulation_failure:
    "Nous n'avons pas pu simuler cette transaction. Vous pouvez néanmoins tenter de la déclencher dans votre portefeuille.",
  simulation_will_revert:
    "La simulation montre que cette transaction échouera. Vous pouvez tout de même essayer de la déclencher dans votre portefeuille.",
  simulation_caution: "Attention",
  transaction_asset_change_type_approve: "Approuver",
  transaction_asset_change_type_transfer: "Transférer",
  transaction_asset_change_to: "À",
  external_wallet_chain_not_supported:
    "Cette chaîne n'est pas prise en charge par votre portefeuille",

  // New Conversation
  cannot_be_added_to_group_yet:
    "{{name}} doit mettre à jour Converse pour être ajouté à un groupe",
  add: "Ajouter",
  add_loading: "Ajout en cours...",
  chat: "Discuter",
  you: "Vous",
  search_results: "RÉSULTATS",
  full_address_hint:
    "Si vous ne voyez pas votre contact dans la liste, essayez de taper son adresse complète (avec {{providers}} etc…)",

  // Group Updated Message
  group_name_changed: 'a changé le nom du groupe en "{{newValue}}".',
  group_member_joined: "a rejoint la conversation",
  group_member_left: "a quitté la conversation",
  group_photo_changed: "a changé la photo du groupe.",
  group_description_changed:
    'a changé la description du groupe en "{{newValue}}".',
  group_name_changed_to: 'a changé le nom du groupe en "{{newValue}}".',

  message_status: {
    sent: "Envoyé",
    delivered: "Envoyé",
    error: "Échec",
    sending: "Envoi en cours",
    prepared: "Envoi en cours",
    seen: "Lu",
  },

  group_placeholder: {
    placeholder_text:
      "Ceci est le début de votre conversation dans {{groupName}}",
  },

  removed_chats: {
    removed_chats: "Conversations supprimées",
    eyes: "👀",
    no_removed_chats:
      "Aucune conversation de groupe supprimée trouvée dans vos conversations existantes.",
  },

  group_screen_member_actions: {
    profile_page: "Page de profil",
    promote_to_admin: "Promouvoir au rang d'administrateur",
    promote_to_super_admin: "Promouvoir au rang de super administrateur",
    revoke_admin: "Révoquer l'administrateur",
    revoke_super_admin: "Révoquer le super administrateur",
    remove_member: "Retirer du groupe",
    cancel: "Annuler",
    super_admin: "Super administrateur",
    admin: "Administrateur",
  },

  ephemeral_account_banner: {
    title: "Ce compte est éphémère",
    subtitle:
      "Déconnectez-vous pour supprimer définitivement votre appareil de ces conversations et garantir un déni plausible.",
  },

  initial_load: {
    title: "Bienvenue sur Converse !",
    subtitle:
      "Nous vérifions si vous possédez déjà des conversations sur le réseau XMTP.",
  },

  recommendations: {
    title:
      "Trouvez des personnes qui partagent vos intérêts. Commencez à leur parler.",
    section_title: "PROFILS RECOMMANDÉS",
    loading: "Chargement de vos recommandations",
    no_recommendations:
      "Nous n'avons trouvé personne à vous suggérer. Nous sommes encore en phase précoce et n'utilisons pas encore beaucoup de signaux. Vous pouvez ",
    signal_list: "trouver la liste actuelle ici",
    please_feel_free_to: ", n'hésitez pas à ",
    contact_pol: "contacter notre co-fondateur Pol",
    if_you_want_us_to_add_anything:
      " si vous souhaitez que nous ajoutions quoi que ce soit. \n\nMerci !",
  },

  top_up: {
    header_title: "Approvisionner",
    title: "Transférer depuis n'importe quel portefeuille",
    alternatively: "Sinon, si vous voulez le faire vous-même, envoyez ",
    usdc: "USDC",
    base: " sur Base",
    native: " (natifs, pas USDbC)",
    to_your_address:
      " sur la blockchain à votre adresse (voir adresse ci-dessous).",
  },

  conversation_list: {
    messages: "Messages",
  },

  debug: {
    converse_log_session: "Session de journalisation Converse",
    libxmtp_log_session: "Session de journalisation LibXMTP",
    converse_version: "Converse v{{version}} ({{buildNumber}})",
  },

  file_preview: "Aperçu du fichier",
};
