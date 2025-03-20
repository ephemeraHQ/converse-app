export const tr = {
  // Onboarding
  onboarding: {
    welcome: {
      title: "Spam olmayın",
      subtitle: "Convos'a Hoş Geldiniz",
      subtext: "Basit · Güvenli · Evrensel",
      createContactCard: "İletişim Kartı Oluştur",
    },
    contactCard: {
      subtitle: "Güvenli bir kimlik",
      body: "İletişim Kartlarını her zaman ekleyin ve düzenleyin,",
      bodyPressable: "veya ekstra gizlilik için Rastgele olun.",
      randoTitle: "Rastgele Ol",
      randoSubtitle: "Rastgele iletişim bilgileriyle sohbet edin",
      randoBody: "Günlük konuşmalar için,",
      randoPressable: "kişisel İletişim Kartınızı kullanın.",
      import: "İçe Aktar",
      name: "İsim",
      namePlaceholder: "Sohbette nasıl görüneceksiniz",
      continue: "Devam",
    },
    notifications: {
      title: "Sadece iyi titreşimler",
      subtitle: "Çoğu şey acil değil. Dikkatini korumak için bildirimleri en aza indirin.",
      essentials: "Temel İhtiyaçlar",
      essentialsDescription: "Onaylanmış kişiler mesaj gönderdiğinde beni uyar",
      mentionsOnly: "Sadece Bahsedildiğimde",
      mentionsOnlyDescription: "Büyük grup sohbetlerinde bahsedilmedikçe beni uyarma",
      cash: "Nakit",
      cashDescription: "Nakit aldığımda hemen beni uyar",
      comingSoon: "Yakında",
      enableNotifications: "Bildirimleri etkinleştir",
      later: "Daha Sonra",
    },
  },
  // Contact Card (used in Onboarding and Profile)
  contactCard: {
    title: "İletişim kartınızı tamamlayın",
    subtitle: "Güvenli bir kimlik",
    body: "İletişim Kartlarını her zaman ekleyin ve düzenleyin,",
    bodyPressable: "veya ekstra gizlilik için Rastgele olun.",
    randoTitle: "Rastgele Ol",
    randoSubtitle: "Rastgele iletişim bilgileriyle sohbet edin",
    randoBody: "Günlük konuşmalar için,",
    randoPressable: "kişisel İletişim Kartınızı kullanın.",
    import: "İçe Aktar",
    name: "İsim",
    namePlaceholder: "Sohbette nasıl görüneceksiniz",
    continue: "Devam",
  },
  userProfile: {
    title: {
      profile: "Profil",
    },
    buttons: {
      continue: "Devam",
      logout: "{{address}}'ten Çıkış Yap",
      cancel: "İptal",
      addProfilePicture: "Profil fotoğrafı ekle",
      changeProfilePicture: "Profil fotoğrafını değiştir",
    },
    inputs: {
      username: {
        placeholder: "Kullanıcı Adı",
      },
      usernameSuffix: ".converse.xyz",
      displayName: {
        placeholder: "Adınızı girin",
        errors: {
          noDots: "Görünen ad nokta içeremez",
        },
      },
    },
    errors: {
      displayNameLength:
        "Görünen adlar 2 ile 32 karakter arasında olmalı ve alan adı uzantıları içeremez",
      usernameAlphanumeric: "Kullanıcı adınız sadece harf ve sayı içerebilir",
      usernameLength: "Kullanıcı adınız 3 ile 30 karakter arasında olmalıdır",
    },
    converseProfiles:
      "Converse ENS ad alanında kimliğinizi talep edin. Bu isim herkes tarafından keşfedilebilir.",
    instructions:
      "Converse ENS ad alanında kimliğinizi talep edin. Bu isim herkes tarafından keşfedilebilir.",
    loadingSentences: {
      claimingIdentity: "Kimliğiniz talep ediliyor",
      connectingENS: "ENS'e bağlanılıyor",
      confirmingAvailability: "Uygunluk doğrulanıyor",
      enablingCCIP: "CCIP etkinleştiriliyor",
      registering: "Kayıt yapılıyor",
      configuringResolver: "Çözümleyici yapılandırılıyor",
      wrappingUp: "Tamamlanıyor",
    },
    mediaOptions: {
      takePhoto: "Fotoğraf çek",
      chooseFromLibrary: "Kütüphaneden seç",
      cancel: "İptal",
    },
    modify: "Profili düzenle",
    edit: "Düzenle",
    done: "Tamam",
    block: {
      title: "Kullanıcıyı engelle",
      message: "{{name}}'i engellemek istediğinizden emin misiniz?",
    },
    unblock: {
      title: "Kullanıcıyı engeli kaldır",
      message: "{{name}}'in engelini kaldırmak istediğinizden emin misiniz?",
    },
    names: "İsimler",
    copied: "Kopyalandı",
  },
  walletSelector: {
    title: "Mesajlarınız.\nGizliliğiniz.",
    subtitle: "Merkezi olmayan mesajlaşma,\nson kullanıcı tarafından şifrelenmiş ve sizin tarafınızdan yönetilen.",
    converseAccount: {
      title: "CONVERSE HESAPLARI",
      connectViaPhone: "Telefonla Bağlan",
      createEphemeral: "Geçici Hesap Oluştur",
    },
    installedApps: {
      title: "YÜKLÜ UYGULAMALAR",
      connectWallet: "{{walletName}}'e Bağlan",
    },
    connectionOptions: {
      title: "BAĞLANTI SEÇENEKLERİ",
      otherOptions: "DİĞER SEÇENEKLER",
      connectExistingWallet: "MEVCUT CÜZDANA BAĞLAN",
      connectForDevs: "GELİŞTİRİCİLER İÇİN",
      connectViaBrowserWallet: "Tarayıcı cüzdanıyla bağlan",
      connectViaDesktop: "Masaüstüyle bağlan",
      connectViaKey: "Anahtarla bağlan",
    },
    popularMobileApps: {
      title: "POPÜLER MOBİL UYGULAMALAR",
    },
    backButton: "Geri",
  },
  privyConnect: {
    title: {
      enterPhone: "Telefon numarasıyla\nbağlan",
      verifyPhone: "Doğrulama kodu",
    },
    storedSecurely:
      "Telefon numaranız güvenli bir şekilde saklanır ve sadece Privy ile paylaşılır, böylece tekrar giriş yapabilirsiniz.",
    buttons: {
      continue: "Devam",
      back: "Geri",
      resendCode: "Kodu tekrar gönder",
    },
    phoneInput: {
      placeholder: "Telefon numaranızı girin",
    },
    otpInput: {
      enterCode: "Doğrulama kodunu girin",
    },
    errors: {
      invalidPhoneNumber: "Lütfen geçerli bir telefon numarası girin",
      invalidCode: "Girdiğiniz kod geçersiz, lütfen tekrar deneyin",
    },
    resendCodeIn: "{{seconds}} saniye içinde kodu tekrar gönder...",
  },
  createEphemeral: {
    title: "Geçici bir hesap oluşturun",
    subtitle:
      "Kimliğinizi paylaşmadan konuşmalar ve bağlantılar oluşturun ve kişisel verileri paylaşmadan bağlı kalın.",
    disconnect_to_remove:
      "Bu hesabı bağlantıyı keserek, cihazınızdan kalıcı olarak verilerini kaldırırsınız.",
    createButton: "Oluştur",
    backButton: "Geri",
  },
  privateKeyConnect: {
    title: "Anahtarla bağlan",
    subtitle:
      "Bağlanmakta olduğunuz adresin özel anahtarını girin.\n\nÖzel anahtarınız saklanmaz.",
    storage: {
      ios: "iPhone'unizin Güvenli Ortamı",
      android: "Android Keystore sistemi",
    },
    connectButton: "Bağlan",
    backButton: "Geri",
    privateKeyPlaceholder: "Bir özel anahtar girin",
    invalidPrivateKey: "Bu özel anahtar geçersiz. Lütfen tekrar deneyin",
  },
  connectViaWallet: {
    sign: "İmzala",
    firstSignature: {
      title: "Başlayın",
      explanation:
        "Sahip olduğunuz güvenli gelen kutusu. Converse, açık kaynaklı güvenli bir mesajlaşma protokolü olan XMTP üzerine inşa edilmiştir.",
    },
    valueProps: {
      e2eEncryption: {
        title: "MLS ile uçtan uca şifreli",
        subtitle:
          "Signal seviyesinde güvenliği her sohbete getiren IETF standart şifreleme.",
      },
      ownCommunications: {
        title: "İletişimlerinizi sonsuza dek sahip olun",
        subtitle: "Mesajlarınız sizindir. Tamamen sizin kontrolünüzde, uygulama değil.",
      },
      chatSecurely: {
        title: "Arkadaşlarınızı davet edin",
        subtitle: "Zincirdeki insanları bulun veya özel QR kodunuzu arkadaşlarınızla paylaşın.",
      },
    },
    cancel: "İptal",
    backButton: "Geri",
    alreadyConnected: {
      title: "Zaten bağlı",
      message: "Bu hesap zaten Converse'a bağlı.",
    },
  },
  passkey: {
    title: "Anahtarla bağlan",
    createButton: "Oluştur",
    add_account_title: "Hesap ekle",
  },
  onboarding_error: "Giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.",
  termsText: "Giriş yaparak",
  termsLink: "şartlarımızı ve koşullarımızı kabul etmiş olursunuz.",

  // Conversation List
  delete: "Sil",
  delete_chat_with: "İle sohbeti sil",
  delete_and_block: "Sil ve engelle",
  remove: "Kaldır",
  remove_and_block_inviter: "Davet edeni kaldır ve engelle",
  restore: "Geri yükle",
  restore_and_unblock_inviter: "Davet edeni geri yükle ve engeli kaldır",
  unblock_and_restore: "Engeli kaldır ve geri yükle",
  back: "Geri",
  close: "Kapat",
  view_only: "Sadece görüntüle",
  view_and_restore: "Görüntüle ve Geri Yükle",
  view_removed_group_chat: "Kaldırılan grup sohbetini görüntüle?",
  connecting: "Bağlanıyor…",
  syncing: "Eşitleniyor…",
  search_chats: "Sohbetleri ara",
  no_results: "Mevcut sohbetlerinizde herhangi bir sonuç bulunamadı. Yeni bir sohbet başlatmak isteyebilirsiniz",
  no_results_start_convo: "yeni bir sohbet başlatın",
  new_account: "Yeni hesap",
  app_settings: "Uygulama ayarları",
  add_an_account: "Hesap ekle",
  group_info: "Grup bilgisi",
  converse_match_maker: "Converse Eşleştirici",
  today: "Bugün",
  yesterday: "Dün",
  member_count: "{{count}} üye",
  members_count: "{{count}} üye",
  modify: "Düzenle",
  pending_count: "{{count}} beklemede",

  // Requests
  clear_all: "Hepsini temizle",
  clear_confirm:
    "Onaylıyor musunuz? Bu, şu anda istek olarak etiketlenmiş tüm hesapları engelleyecektir.",
  clearing: "Temizleniyor",
  suggestion_text:
    "Zincirdeki geçmişinize göre tanıdığınız kişiler hakkında bazı önerilerde bulunduk.",
  no_suggestions_text:
    "Şu anda mesaj isteğiniz yok. Bağlantı kurdukça burada önerilerde bulunacağız.",
  hidden_requests_warn:
    "Saldırgan veya istenmeyen mesajları içeren istekler bu klasöre taşınır.",

  // Conversation
  decline: "Reddet",
  unblock: "Engeli kaldır",
  if_you_unblock_contact:
    "Bu kişinin engelini kaldırdığınızda, size tekrar mesaj gönderebilir.",
  if_you_block_contact:
    "Bu kişiyi engellerseniz, artık mesajlarını almayacaksınız",
  opening_conversation: "Sohbetiniz açılıyor",
  conversation_not_found: "Bu sohbet bulunamadı. Lütfen tekrar deneyin",
  group_not_found:
    "Bu grup bulunamadı. Lütfen tekrar deneyin veya bu gruba davet edilmenizi isteyin",
  say_hi: "Merhaba de",
  join_this_group: "Bu gruba katıl",
  identity_not_found_title: "Kimlik bulunamadı",
  identity_not_found: "{{identity}} kimliği bulunamadı veya geçersiz. Lütfen kontrol edin ve tekrar deneyin",
  identity_not_found_timeout:
    "{{identity}} kimliği çözümlenmesi çok uzun sürdü. Lütfen bağlantınızı kontrol edin ve tekrar deneyin",
  identity_not_yet_xmtp_title: "Henüz XMTP kullanmıyor",
  identity_not_yet_xmtp:
    "{{identity}} henüz XMTP kullanmıyor. Converse'ı converse.xyz adresinden indirmelerini ve cüzdanlarıyla giriş yapmalarını söyleyin",

  attachment_not_found: "Ek bulunamadı",
  // Conversation Context Menu
  pin: "Sabitle",
  unpin: "Sabitlemeyi kaldır",
  mark_as_read: "Okundu olarak işaretle",
  mark_as_unread: "Okunmadı olarak işaretle",

  // NewGroupSummary
  group_name: "GRUP ADI",
  group_description: "GRUP AÇIKLAMASI",
  upload_group_photo_error: "Grup fotoğrafı yüklenirken hata oluştu",
  promote_to_admin_to_manage_group:
    "Grup oluşturduktan sonra, üyeleri ve grup bilgilerini yönetmek için herkesi yönetici olarak terfi ettirebilirsiniz.",

  // Profile
  remove_from_group: "Gruptan kaldır",
  are_you_sure: "Emin misiniz?",
  promote_to_admin: "Yönetici olarak terfi ettir",
  send_a_message: "Mesaj gönder",
  client_error: "Bir şeyler yanlış gitti, lütfen tekrar bağlanmayı deneyin.",
  actions: "EYLEMLER",
  common_activity: "ORTAK ETKİNLİK",
  social: "SOSYAL",
  address: "ADRES",
  youre_the_og: "SEN OG'SİN",
  app_version: "UYGULAMA SÜRÜMÜ",
  security: "GÜVENLİK",
  xmtp_wrong_signer: "Yanlış cüzdan",
  xmtp_wrong_signer_description:
    "Bağlı cüzdan bu XMTP kimliğine sahip değil. Bağlantıyı kestik, lütfen tekrar deneyin.",
  promote_to_super_admin: "Süper yönetici olarak terfi ettir",
  revoke_super_admin: "Süper yöneticiyi geri al",
  revoke_admin: "Yöneticiyi geri al",
  remove_member: "Gruptan kaldır",
  invite_more_friends: "Daha fazla arkadaş davet et",
  top_up_your_account: "Hesabınızı yükleyin",
  you_parentheses: " (sen)",
  disconnect_delete_local_data: "Bağlantıyı kes ve yerel verileri sil",
  disconnect_this_account: "Bu hesabın bağlantısını kes",
  disconnect_account_description:
    "Grup sohbetleriniz Converse'ı sildiğiniz sürece cihazınızda şifrelenir ve kaydedilir. DM'leriniz XMTP ağı tarafından yedeklenecektir.",
  your_profile_page: "Profil sayfanız",
  copy_wallet_address: "Cüzdan adresini kopyala",
  attachment_message_error_download: "Ek indirilemedi",

  // Context Menu
  reply: "Yanıtla",
  copy: "Kopyala",
  share: "Paylaş",
  share_frame: "Çerçeveyi Paylaş",

  // Attachments
  photo_library: "Fotoğraf Kütüphanesi",
  camera: "Kamera",
  attachment_message_view_in_browser: "Tarayıcıda görüntüle",
  attachment: "Ek",

  // Reactions
  reacted_to_media: "Bir medyaya {{reactionContent}} tepki gösterdi",
  reacted_to_transaction: "Bir işleme {{reactionContent}} tepki gösterdi",
  reacted_to_other: '"{{content}}" içeriğine {{reactionContent}} tepki gösterdi',
  removed_reaction_to_attachment: "Bir eke olan tepkiyi kaldırdı",
  removed_reaction_to: '"{{content}}" içeriğine olan tepkiyi kaldırdı',

  // Group Invites
  open_conversation: "Sohbeti aç",

  // Group Overview
  change_profile_picture: "Profil fotoğrafını değiştir",
  add_profile_picture: "Profil fotoğrafı ekle",
  add_description: "Açıklama ekle",
  restore_group: "Grupu geri yükle",
  remove_group: "Grupu kaldır",
  actions_title: "EYLEMLER",
  members_title: "ÜYELER",
  membership_requests_title: "ÜYELİK İSTEKLERİ",
  group_invite_link_created_copied: "Davet bağlantısı oluşturuldu ve kopyalandı!",
  group_invite_link_copied: "Davet bağlantısı kopyalandı!",
  group_invite_link_deleted: "Davet bağlantısı silindi!",
  add_more_members: "Daha fazla üye ekle",
  copy_invite_link: "Davet bağlantısını kopyala",
  create_invite_link: "Davet bağlantısı oluştur",
  pending: "Beklemede",
  approve: "Onayla",
  deny: "Reddet",
  approve_member_to_this_group: "{{name}}'i bu gruba onayla",
  group_opertation_an_error_occurred: "Bir hata oluştu",

  // New Group
  new_group: {
    add_members: "Üye ekle",
    edit_group_info: "Grup bilgisini düzenle",
    members_can: "ÜYELER YAPABİLİR",
    title: "Yeni grup",
  },

  new_chat: {
    create_group: "Grup oluştur",
    back: "Geri",
    create: "Oluştur",
    add_members: "Üye ekle",
    new_chat: "Yeni sohbet",
    invite_to_converse: "Converse'a davet et",
  },

  invite_to_group: {
    title: "Gruba davet et",
    add_members: "Üye ekle",
    invite_to_converse: "Converse'a davet et",
  },

  // Wallet selector
  no_wallet_detected: "Cüzdan algılanmadı",

  // Profile
  view_removed_chats: "Kaldırılan sohbetleri görüntüle",
  change_or_add_account: "Hesabı değiştir veya ekle",
  profile: {
    modify_profile: "Profili düzenle",
    edit: "Düzenle",
    block: {
      title: "Kullanıcıyı engelle",
      message: "{{name}}'i engellemek istediğinizden emin misiniz?",
    },
    save: "Kaydet",
    done: "Tamam",
    names: "İsimler",
    copied: "Kopyalandı",
    settings: {
      notifications: "Bildirimler",
    },
  },

  // Revocation
  current_installation_revoked: "Çıkış yapıldı",
  current_installation_revoked_description:
    "Hesabınızdan çıkış yaptınız. Grup sohbetleriniz bu cihazdan silinecek.",
  other_installations_count: "{{count}} aktif oturumunuz var",
  revoke_description: "Diğer tüm oturumlardan çıkış yapmak ister misiniz?",
  revoke_done_title: "Tamamlandı",
  revoke_done_description: "{{count}} oturumdan çıkış yapıldı",
  revoke_empty: "Başka aktif oturumunuz yok",
  revoke_others_cta: "Diğerlerini çıkış yap",
  revoke_wallet_picker_title: "Diğerlerini çıkış yap",
  revoke_wallet_picker_description:
    "XMTP hesabınıza bağlı cüzdanı bağlayın: {{wallet}}",

  // Emoji Picker
  choose_a_reaction: "Bir tepki seçin",
  search_emojis: "Emojileri ara",
  emoji_picker_all: "Hepsi",

  // Chat null state
  connectWithYourNetwork: "Arkadaşlarınızı bulun",
  shareYourQRCode: "QR kodunuzu paylaşın",
  moveOrConnect: "Bir sohbeti Converse'a taşıyın\nveya yeni birisiyle bağlantı kurun.",
  findContacts: "Zincirdeki etkinliğinize göre bazı önerilen kişiler",
  copyShareLink: "Paylaşma Bağlantısını Kopyala",
  alphaTestTitle: "Converse'ın geleceğini şekillendirmeye yardımcı olun!",
  alphaTestDescription:
    "Converse ekibi ve diğer alfa testçilerle görüşlerinizi ve fikirlerinizi paylaşın.",
  joinAlphaGroup: "Converse VIP Alfa Sohbetine Katılın",
  linkCopied: "Bağlantı kopyalandı",

  // Transactional frames
  transactionalFrameConnectWallet: "Bir cüzdan uygulamasına bağlanarak bir işlemi tetikleyin",
  transaction_failure: "İşlem başarısız",
  transaction_pending: "{{wallet}}'da onaylayın",
  transaction_triggering: "{{wallet}} açılıyor...",
  transaction_triggered: "İşleminiz yürütülüyor...",
  transaction_success: "Tamamlandı!",
  transaction_switch_chain: "{{wallet}}'da {{chainName}} zincirine geçin",
  transaction_wallet: "Cüzdan",

  // Transaction Simulation
  simulation_pending: "Bu İşlem Güvenli Bir Şekilde Simüle Ediliyor",
  simulation_failure:
    "Bu işlemi simüle edemedik. Hala cüzdanınızda tetikleyebilirsiniz.",
  simulation_will_revert:
    "Simülasyon, bu işlemin geri döneceğini gösteriyor. Hala cüzdanınızda denemeye çalışabilirsiniz.",
  simulation_caution: "Dikkat",
  transaction_asset_change_type_approve: "Onayla",
  transaction_asset_change_type_transfer: "Transfer",
  transaction_asset_change_to: "İçin",
  external_wallet_chain_not_supported: "Bu zincir cüzdanınız tarafından desteklenmiyor",

  // New Conversation
  cannot_be_added_to_group_yet: "{{name}} gruba eklenmek için Converse'ı güncellemelidir",
  add: "Ekle",
  add_loading: "Ekleniyor...",
  chat: "Sohbet",
  you: "Sen",
  search_results: "SONUÇLAR",
  full_address_hint:
    "Kişiyi listede göremiyorsanız, tam adresini ({{providers}} vb.) yazmayı deneyin",

  // Group Updated Message
  group_name_changed: 'grup adını "{{newValue}}" olarak değiştirdi.',
  group_member_joined: "sohbete katıldı",
  group_member_left: "sohbetten ayrıldı",
  group_photo_changed: "grup fotoğrafını değiştirdi.",
  group_description_changed: 'grup açıklamasını "{{newValue}}" olarak değiştirdi.',
  group_name_changed_to: 'grup adını "{{newValue}}" olarak değiştirdi.',

  message_status: {
    sent: "Gönderildi",
    delivered: "Gönderildi",
    error: "Başarısız",
    sending: "Gönderiliyor",
    prepared: "Gönderiliyor",
    seen: "Okundu",
  },

  this_is_the_beginning_of_your_conversation_with:
    "{{name}} ile sohbetinizin başlangıcı budur",

  group_placeholder: {
    placeholder_text: "{{groupName}}'da sohbetinizin başlangıcı budur",
  },

  removed_chats: {
    removed_chats: "Kaldırılan Sohbetler",
    eyes: "👀",
    no_removed_chats: "Mevcut sohbetlerinizde kaldırılan grup sohbeti bulunamadı.",
  },

  group_screen_member_actions: {
    profile_page: "Profil sayfası",
    promote_to_admin: "Yönetici olarak terfi ettir",
    promote_to_super_admin: "Süper yönetici olarak terfi ettir",
    revoke_admin: "Yöneticiyi geri al",
    revoke_super_admin: "Süper yöneticiyi geri al",
    remove_member: "Gruptan kaldır",
    cancel: "İptal",
    super_admin: "Süper Yönetici",
    admin: "Yönetici",
  },

  ephemeral_account_banner: {
    title: "Bu hesap geçicidir",
    subtitle:
      "Bu sohbetlerden cihazınızı kalıcı olarak kaldırmak ve reddedilebilirliği sağlamak için bağlantıyı kesin.",
  },

  initial_load: {
    title: "Converse'e Hoş Geldiniz!",
    subtitle: "XMTP ağında zaten sohbetiniz olup olmadığını kontrol ediyoruz.",
  },

  recommendations: {
    title: "İlgi alanlarınızı paylaşan insanları bulun ve onlarla konuşmaya başlayın.",
    section_title: "ÖNERİLEN PROFİLLER",
    loading: "Önerileriniz yükleniyor",
    no_recommendations:
      "Sizinle eşleştirebileceğimiz kişiler bulunamadı. Hala erken aşamadayız ve çok fazla sinyal kullanmıyoruz. ",
    signal_list: "geçerli listeyi burada bulabilirsiniz",
    please_feel_free_to: ", lütfen şunu yapın: ",
    contact_pol: "kurucu ortağımız Pol ile iletişime geçin",
    if_you_want_us_to_add_anything: "eklememizi istiyorsanız. \n\nTeşekkürler!",
  },

  top_up: {
    header_title: "Yükle",
    title: "Herhangi bir cüzdandan köprü kurun",
    alternatively: "Eğer kendiniz yapmak istiyorsanız, ",
    usdc: "USDC",
    base: "Temel",
    native: " (native, USDbC değil) zincirindeki ",
    to_your_address: " adresinize (aşağıdaki adrese bakın).",
  },

  conversation_list: {
    messages: "Mesajlar",
    attachment: "Ek",
    updated_the_group: "{{username}} grubu güncelledi",
    group_updated: "Grup güncellendi",
    name_changed: "{{username}} grubun adını {{newValue}} olarak değiştirdi",
    description_changed: "{{username}} grubun açıklamasını {{newValue}} olarak değiştirdi",
    image_changed: "{{username}} grubun fotoğrafını değiştirdi",
    member_added: "{{username}} {{memberName}}'i gruba ekledi",
    member_added_unknown: "{{username}} gruba yeni bir üye ekledi",
    members_added: "{{username}} {{count}} üyeyi gruba ekledi",
    member_removed: "{{username}} {{memberName}}'i gruptan kaldırdı",
    member_removed_unknown: "{{username}} bir üyeyi gruptan kaldırdı",
    members_removed: "{{username}} {{count}} üyeyi gruptan kaldırdı",
  },

  file_preview: "Dosya önizlemesi",

  share_profile: {
    link_copied: "Bağlantı kopyalandı",
    copy_link: "Bağlantıyı kopyala",
  },
}

export type Translations = typeof tr
