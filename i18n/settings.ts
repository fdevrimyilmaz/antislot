import type { Ionicons } from "@expo/vector-icons";
import type { Language } from "@/i18n/translations";

export type LinkItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

export type SettingsText = {
  links: {
    protection: LinkItem[];
    support: LinkItem[];
    legal: LinkItem[];
    dev: LinkItem[];
  };
  toast: {
    lockTitle: string;
    lockMessage: (remaining: string) => string;
    minSelectionTitle: string;
    minSelectionMessage: string;
    savedTitle: string;
    savedMessage: string;
    errorTitle: string;
    errorMessage: string;
  };
  header: {
    loadingAccessibility: string;
    back: string;
    title: string;
  };
  theme: {
    autoSystem: string;
    custom: string;
    sectionTitle: string;
    sectionSubtitle: string;
    openGalleryA11y: string;
    galleryTitle: string;
    gallerySubtitle: (activeLabel: string) => string;
  };
  tracking: {
    title: string;
    subtitle: string;
    lockNotice: (remaining: string) => string;
    toggleHint: string;
    toggleA11y: (label: string) => string;
    inlineWarning: string;
    saveLabel: string;
    savingLabel: string;
  };
  sections: {
    protectionTitle: string;
    protectionSubtitle: string;
    supportTitle: string;
    supportSubtitle: string;
    legalTitle: string;
    legalSubtitle: string;
    devTitle: string;
  };
};

export const SETTINGS_LOCALES: Record<Language, SettingsText> = {
  tr: {
    links: {
      protection: [
        { label: "Öz-Kısıtlama", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Risk Pencereleri", icon: "time", route: "/risk-windows" },
        { label: "Bildirimler", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Destek Ağı", icon: "people", route: "/support" },
        { label: "SMS Spam Tanıyıcı", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Verilerimi Dışa Aktar", icon: "download", route: "/data-export" },
        { label: "Gizlilik Politikası", icon: "lock-closed", route: "/privacy" },
        { label: "Kullanım Şartları", icon: "document-text", route: "/terms" },
        { label: "Sınırlamalar", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Tanılamalar", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Kilitli",
      lockMessage: (remaining) => `Öz-Kısıtlama aktif — ${remaining} kaldı.`,
      minSelectionTitle: "Seçim Gerekli",
      minSelectionMessage: "En az bir bağımlılık seçili olmalı.",
      savedTitle: "Kaydedildi",
      savedMessage: "Kumar takibi güncellendi.",
      errorTitle: "Hata",
      errorMessage: "Ayarlar kaydedilemedi.",
    },
    header: {
      loadingAccessibility: "Ayarlar yükleniyor",
      back: "Geri",
      title: "Ayarlar",
    },
    theme: {
      autoSystem: "Otomatik (sistem)",
      custom: "Özel",
      sectionTitle: "Görsel Tema",
      sectionSubtitle: "10 hazır palet ve sistem takip seçeneği.",
      openGalleryA11y: "Tema galerisini aç",
      galleryTitle: "Tema Galerisi",
      gallerySubtitle: (activeLabel) => `Aktif: ${activeLabel} · canlı önizlemeyle değiştir`,
    },
    tracking: {
      title: "Kumar Takibi",
      subtitle: "Kumar takibini açıp kapatabilirsiniz. En az bir seçim gerekli.",
      lockNotice: (remaining) => `Öz-Kısıtlama aktif — ${remaining} kaldı. Değişiklikler kilitli.`,
      toggleHint: "Takibi aç / kapat",
      toggleA11y: (label) => `${label} takibi`,
      inlineWarning: "En az bir seçim yapmalısınız.",
      saveLabel: "Kaydet",
      savingLabel: "Kaydediliyor",
    },
    sections: {
      protectionTitle: "Korunma",
      protectionSubtitle: "Öz-Kısıtlama, risk pencereleri ve bildirim ayarları.",
      supportTitle: "Destek ve Yardım",
      supportSubtitle: "Krizde hızlı erişim ve destek araçları.",
      legalTitle: "Gizlilik ve Yasal",
      legalSubtitle: "Politikalar, sınırlamalar ve veri kullanımı.",
      devTitle: "Geliştirici",
    },
  },
  en: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Risk Windows", icon: "time", route: "/risk-windows" },
        { label: "Notifications", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Support Network", icon: "people", route: "/support" },
        { label: "SMS Spam Detector", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Export My Data", icon: "download", route: "/data-export" },
        { label: "Privacy Policy", icon: "lock-closed", route: "/privacy" },
        { label: "Terms of Use", icon: "document-text", route: "/terms" },
        { label: "Limitations", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostics", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Locked",
      lockMessage: (remaining) => `Self-Exclusion is active — ${remaining} left.`,
      minSelectionTitle: "Selection Required",
      minSelectionMessage: "At least one addiction must remain selected.",
      savedTitle: "Saved",
      savedMessage: "Gambling tracking has been updated.",
      errorTitle: "Error",
      errorMessage: "Settings could not be saved.",
    },
    header: {
      loadingAccessibility: "Settings loading",
      back: "Back",
      title: "Settings",
    },
    theme: {
      autoSystem: "Automatic (system)",
      custom: "Custom",
      sectionTitle: "Visual Theme",
      sectionSubtitle: "10 preset palettes with system-follow mode.",
      openGalleryA11y: "Open theme gallery",
      galleryTitle: "Theme Gallery",
      gallerySubtitle: (activeLabel) => `Active: ${activeLabel} · switch with live preview`,
    },
    tracking: {
      title: "Gambling Tracking",
      subtitle: "You can enable or disable gambling tracking. At least one selection is required.",
      lockNotice: (remaining) => `Self-Exclusion is active — ${remaining} left. Changes are locked.`,
      toggleHint: "Enable / disable tracking",
      toggleA11y: (label) => `${label} tracking`,
      inlineWarning: "You must keep at least one selection.",
      saveLabel: "Save",
      savingLabel: "Saving",
    },
    sections: {
      protectionTitle: "Protection",
      protectionSubtitle: "Self-exclusion, risk windows, and notification settings.",
      supportTitle: "Support and Help",
      supportSubtitle: "Crisis-time quick access and support tools.",
      legalTitle: "Privacy and Legal",
      legalSubtitle: "Policies, limitations, and data usage.",
      devTitle: "Developer",
    },
  },
  de: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Risikofenster", icon: "time", route: "/risk-windows" },
        { label: "Benachrichtigungen", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Unterstützungsnetzwerk", icon: "people", route: "/support" },
        { label: "SMS-Spam-Erkennung", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Daten exportieren", icon: "download", route: "/data-export" },
        { label: "Datenschutzerklärung", icon: "lock-closed", route: "/privacy" },
        { label: "Nutzungsbedingungen", icon: "document-text", route: "/terms" },
        { label: "Einschränkungen", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnose", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Gesperrt",
      lockMessage: (remaining) => `Self-Exclusion aktiv — ${remaining} verbleibend.`,
      minSelectionTitle: "Auswahl erforderlich",
      minSelectionMessage: "Mindestens eine Abhängigkeit muss ausgewählt bleiben.",
      savedTitle: "Gespeichert",
      savedMessage: "Glücksspiel-Tracking aktualisiert.",
      errorTitle: "Fehler",
      errorMessage: "Einstellungen konnten nicht gespeichert werden.",
    },
    header: {
      loadingAccessibility: "Einstellungen werden geladen",
      back: "Zurück",
      title: "Einstellungen",
    },
    theme: {
      autoSystem: "Automatisch (System)",
      custom: "Benutzerdefiniert",
      sectionTitle: "Visuelles Theme",
      sectionSubtitle: "10 voreingestellte Paletten mit System-Modus.",
      openGalleryA11y: "Theme-Galerie öffnen",
      galleryTitle: "Theme-Galerie",
      gallerySubtitle: (activeLabel) => `Aktiv: ${activeLabel} · mit Live-Vorschau wechseln`,
    },
    tracking: {
      title: "Glücksspiel-Tracking",
      subtitle: "Du kannst das Tracking aktivieren oder deaktivieren. Mindestens eine Auswahl erforderlich.",
      lockNotice: (remaining) => `Self-Exclusion aktiv — ${remaining} verbleibend. Änderungen gesperrt.`,
      toggleHint: "Tracking ein- / ausschalten",
      toggleA11y: (label) => `${label} Tracking`,
      inlineWarning: "Mindestens eine Auswahl muss erhalten bleiben.",
      saveLabel: "Speichern",
      savingLabel: "Wird gespeichert",
    },
    sections: {
      protectionTitle: "Schutz",
      protectionSubtitle: "Self-Exclusion, Risikofenster und Benachrichtigungseinstellungen.",
      supportTitle: "Support und Hilfe",
      supportSubtitle: "Schneller Zugang im Krisenfall und Support-Tools.",
      legalTitle: "Datenschutz und Recht",
      legalSubtitle: "Richtlinien, Einschränkungen und Datennutzung.",
      devTitle: "Entwickler",
    },
  },
  fr: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Fenêtres de risque", icon: "time", route: "/risk-windows" },
        { label: "Notifications", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Réseau de soutien", icon: "people", route: "/support" },
        { label: "Détecteur de spam SMS", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Exporter mes données", icon: "download", route: "/data-export" },
        { label: "Politique de confidentialité", icon: "lock-closed", route: "/privacy" },
        { label: "Conditions d'utilisation", icon: "document-text", route: "/terms" },
        { label: "Limitations", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostics", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Verrouillé",
      lockMessage: (remaining) => `Self-Exclusion actif — ${remaining} restant.`,
      minSelectionTitle: "Sélection requise",
      minSelectionMessage: "Au moins une addiction doit rester sélectionnée.",
      savedTitle: "Enregistré",
      savedMessage: "Suivi du jeu mis à jour.",
      errorTitle: "Erreur",
      errorMessage: "Les paramètres n'ont pas pu être enregistrés.",
    },
    header: {
      loadingAccessibility: "Chargement des paramètres",
      back: "Retour",
      title: "Paramètres",
    },
    theme: {
      autoSystem: "Automatique (système)",
      custom: "Personnalisé",
      sectionTitle: "Thème visuel",
      sectionSubtitle: "10 palettes prédéfinies avec mode système.",
      openGalleryA11y: "Ouvrir la galerie de thèmes",
      galleryTitle: "Galerie de thèmes",
      gallerySubtitle: (activeLabel) => `Actif : ${activeLabel} · changer avec aperçu en direct`,
    },
    tracking: {
      title: "Suivi du jeu",
      subtitle: "Tu peux activer ou désactiver le suivi du jeu. Au moins une sélection est requise.",
      lockNotice: (remaining) => `Self-Exclusion actif — ${remaining} restant. Changements verrouillés.`,
      toggleHint: "Activer / désactiver le suivi",
      toggleA11y: (label) => `Suivi ${label}`,
      inlineWarning: "Tu dois conserver au moins une sélection.",
      saveLabel: "Enregistrer",
      savingLabel: "Enregistrement",
    },
    sections: {
      protectionTitle: "Protection",
      protectionSubtitle: "Self-exclusion, fenêtres de risque et notifications.",
      supportTitle: "Support et aide",
      supportSubtitle: "Accès rapide en crise et outils de soutien.",
      legalTitle: "Confidentialité et juridique",
      legalSubtitle: "Politiques, limitations et utilisation des données.",
      devTitle: "Développeur",
    },
  },
  es: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Ventanas de Riesgo", icon: "time", route: "/risk-windows" },
        { label: "Notificaciones", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Red de Apoyo", icon: "people", route: "/support" },
        { label: "Detector de Spam SMS", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Exportar mis datos", icon: "download", route: "/data-export" },
        { label: "Política de Privacidad", icon: "lock-closed", route: "/privacy" },
        { label: "Términos de Uso", icon: "document-text", route: "/terms" },
        { label: "Limitaciones", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnósticos", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Bloqueado",
      lockMessage: (remaining) => `Self-Exclusion activo — quedan ${remaining}.`,
      minSelectionTitle: "Selección requerida",
      minSelectionMessage: "Al menos una adicción debe permanecer seleccionada.",
      savedTitle: "Guardado",
      savedMessage: "Seguimiento del juego actualizado.",
      errorTitle: "Error",
      errorMessage: "No se pudieron guardar los ajustes.",
    },
    header: {
      loadingAccessibility: "Cargando ajustes",
      back: "Atrás",
      title: "Ajustes",
    },
    theme: {
      autoSystem: "Automático (sistema)",
      custom: "Personalizado",
      sectionTitle: "Tema visual",
      sectionSubtitle: "10 paletas predefinidas con modo sistema.",
      openGalleryA11y: "Abrir galería de temas",
      galleryTitle: "Galería de temas",
      gallerySubtitle: (activeLabel) => `Activo: ${activeLabel} · cambia con vista previa en vivo`,
    },
    tracking: {
      title: "Seguimiento del Juego",
      subtitle: "Puedes activar o desactivar el seguimiento del juego. Se requiere al menos una selección.",
      lockNotice: (remaining) => `Self-Exclusion activo — quedan ${remaining}. Cambios bloqueados.`,
      toggleHint: "Activar / desactivar seguimiento",
      toggleA11y: (label) => `Seguimiento de ${label}`,
      inlineWarning: "Debes mantener al menos una selección.",
      saveLabel: "Guardar",
      savingLabel: "Guardando",
    },
    sections: {
      protectionTitle: "Protección",
      protectionSubtitle: "Self-exclusion, ventanas de riesgo y notificaciones.",
      supportTitle: "Soporte y Ayuda",
      supportSubtitle: "Acceso rápido en crisis y herramientas de apoyo.",
      legalTitle: "Privacidad y Legal",
      legalSubtitle: "Políticas, limitaciones y uso de datos.",
      devTitle: "Desarrollador",
    },
  },
  it: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Finestre di Rischio", icon: "time", route: "/risk-windows" },
        { label: "Notifiche", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Rete di Supporto", icon: "people", route: "/support" },
        { label: "Rilevatore Spam SMS", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Esporta i miei dati", icon: "download", route: "/data-export" },
        { label: "Informativa sulla privacy", icon: "lock-closed", route: "/privacy" },
        { label: "Termini di utilizzo", icon: "document-text", route: "/terms" },
        { label: "Limitazioni", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostica", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Bloccato",
      lockMessage: (remaining) => `Self-Exclusion attivo — ${remaining} rimanenti.`,
      minSelectionTitle: "Selezione richiesta",
      minSelectionMessage: "Almeno una dipendenza deve rimanere selezionata.",
      savedTitle: "Salvato",
      savedMessage: "Monitoraggio del gioco aggiornato.",
      errorTitle: "Errore",
      errorMessage: "Le impostazioni non sono state salvate.",
    },
    header: {
      loadingAccessibility: "Caricamento impostazioni",
      back: "Indietro",
      title: "Impostazioni",
    },
    theme: {
      autoSystem: "Automatico (sistema)",
      custom: "Personalizzato",
      sectionTitle: "Tema visivo",
      sectionSubtitle: "10 palette predefinite con modalità sistema.",
      openGalleryA11y: "Apri galleria temi",
      galleryTitle: "Galleria temi",
      gallerySubtitle: (activeLabel) => `Attivo: ${activeLabel} · cambia con anteprima live`,
    },
    tracking: {
      title: "Monitoraggio del Gioco",
      subtitle: "Puoi attivare o disattivare il monitoraggio del gioco. Almeno una selezione richiesta.",
      lockNotice: (remaining) => `Self-Exclusion attivo — ${remaining} rimanenti. Modifiche bloccate.`,
      toggleHint: "Attiva / disattiva monitoraggio",
      toggleA11y: (label) => `Monitoraggio di ${label}`,
      inlineWarning: "Devi mantenere almeno una selezione.",
      saveLabel: "Salva",
      savingLabel: "Salvataggio",
    },
    sections: {
      protectionTitle: "Protezione",
      protectionSubtitle: "Self-exclusion, finestre di rischio e notifiche.",
      supportTitle: "Supporto e Aiuto",
      supportSubtitle: "Accesso rapido in caso di crisi e strumenti di supporto.",
      legalTitle: "Privacy e Legale",
      legalSubtitle: "Informative, limitazioni e uso dei dati.",
      devTitle: "Sviluppatore",
    },
  },
  pt: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Janelas de Risco", icon: "time", route: "/risk-windows" },
        { label: "Notificações", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Rede de Apoio", icon: "people", route: "/support" },
        { label: "Detetor de Spam SMS", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Exportar os meus dados", icon: "download", route: "/data-export" },
        { label: "Política de Privacidade", icon: "lock-closed", route: "/privacy" },
        { label: "Termos de Utilização", icon: "document-text", route: "/terms" },
        { label: "Limitações", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnóstico", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Bloqueado",
      lockMessage: (remaining) => `Self-Exclusion ativo — ${remaining} restantes.`,
      minSelectionTitle: "Seleção necessária",
      minSelectionMessage: "Pelo menos um vício deve permanecer selecionado.",
      savedTitle: "Guardado",
      savedMessage: "Acompanhamento de jogo atualizado.",
      errorTitle: "Erro",
      errorMessage: "Não foi possível guardar as definições.",
    },
    header: {
      loadingAccessibility: "A carregar definições",
      back: "Voltar",
      title: "Definições",
    },
    theme: {
      autoSystem: "Automático (sistema)",
      custom: "Personalizado",
      sectionTitle: "Tema Visual",
      sectionSubtitle: "10 paletas predefinidas com modo sistema.",
      openGalleryA11y: "Abrir galeria de temas",
      galleryTitle: "Galeria de Temas",
      gallerySubtitle: (activeLabel) => `Ativo: ${activeLabel} · muda com pré-visualização ao vivo`,
    },
    tracking: {
      title: "Acompanhamento de Jogo",
      subtitle: "Podes ativar ou desativar o acompanhamento. Pelo menos uma seleção é necessária.",
      lockNotice: (remaining) => `Self-Exclusion ativo — ${remaining} restantes. Alterações bloqueadas.`,
      toggleHint: "Ligar / desligar acompanhamento",
      toggleA11y: (label) => `Acompanhamento de ${label}`,
      inlineWarning: "Deves manter pelo menos uma seleção.",
      saveLabel: "Guardar",
      savingLabel: "A guardar",
    },
    sections: {
      protectionTitle: "Proteção",
      protectionSubtitle: "Self-exclusion, janelas de risco e notificações.",
      supportTitle: "Suporte e Ajuda",
      supportSubtitle: "Acesso rápido em crise e ferramentas de apoio.",
      legalTitle: "Privacidade e Legal",
      legalSubtitle: "Políticas, limitações e uso de dados.",
      devTitle: "Programador",
    },
  },
  ar: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "نوافذ المخاطر", icon: "time", route: "/risk-windows" },
        { label: "الإشعارات", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "شبكة الدعم", icon: "people", route: "/support" },
        { label: "كاشف رسائل SMS العشوائية", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "تصدير بياناتي", icon: "download", route: "/data-export" },
        { label: "سياسة الخصوصية", icon: "lock-closed", route: "/privacy" },
        { label: "شروط الاستخدام", icon: "document-text", route: "/terms" },
        { label: "القيود", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "التشخيصات", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "مقفل",
      lockMessage: (remaining) => `Self-Exclusion نشط — ${remaining} متبقي.`,
      minSelectionTitle: "اختيار مطلوب",
      minSelectionMessage: "يجب أن يبقى إدمان واحد على الأقل محددًا.",
      savedTitle: "تم الحفظ",
      savedMessage: "تم تحديث متابعة القمار.",
      errorTitle: "خطأ",
      errorMessage: "تعذر حفظ الإعدادات.",
    },
    header: {
      loadingAccessibility: "جارٍ تحميل الإعدادات",
      back: "رجوع",
      title: "الإعدادات",
    },
    theme: {
      autoSystem: "تلقائي (النظام)",
      custom: "مخصص",
      sectionTitle: "السمة المرئية",
      sectionSubtitle: "10 لوحات جاهزة مع وضع متابعة النظام.",
      openGalleryA11y: "افتح معرض السمات",
      galleryTitle: "معرض السمات",
      gallerySubtitle: (activeLabel) => `نشط: ${activeLabel} · غيّر بمعاينة مباشرة`,
    },
    tracking: {
      title: "متابعة القمار",
      subtitle: "يمكنك تفعيل أو إيقاف متابعة القمار. يلزم اختيار واحد على الأقل.",
      lockNotice: (remaining) => `Self-Exclusion نشط — ${remaining} متبقي. التغييرات مقفلة.`,
      toggleHint: "تفعيل / إيقاف المتابعة",
      toggleA11y: (label) => `متابعة ${label}`,
      inlineWarning: "يجب الحفاظ على اختيار واحد على الأقل.",
      saveLabel: "حفظ",
      savingLabel: "جارٍ الحفظ",
    },
    sections: {
      protectionTitle: "الحماية",
      protectionSubtitle: "Self-exclusion ونوافذ المخاطر والإشعارات.",
      supportTitle: "الدعم والمساعدة",
      supportSubtitle: "وصول سريع وقت الأزمة وأدوات الدعم.",
      legalTitle: "الخصوصية والقانون",
      legalSubtitle: "السياسات والقيود واستخدام البيانات.",
      devTitle: "المطور",
    },
  },
  ru: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Окна риска", icon: "time", route: "/risk-windows" },
        { label: "Уведомления", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Сеть поддержки", icon: "people", route: "/support" },
        { label: "Детектор SMS-спама", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Экспортировать данные", icon: "download", route: "/data-export" },
        { label: "Политика конфиденциальности", icon: "lock-closed", route: "/privacy" },
        { label: "Условия использования", icon: "document-text", route: "/terms" },
        { label: "Ограничения", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Диагностика", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Заблокировано",
      lockMessage: (remaining) => `Self-Exclusion активен — осталось ${remaining}.`,
      minSelectionTitle: "Нужен выбор",
      minSelectionMessage: "Должна оставаться выбрана хотя бы одна зависимость.",
      savedTitle: "Сохранено",
      savedMessage: "Отслеживание игр обновлено.",
      errorTitle: "Ошибка",
      errorMessage: "Не удалось сохранить настройки.",
    },
    header: {
      loadingAccessibility: "Загрузка настроек",
      back: "Назад",
      title: "Настройки",
    },
    theme: {
      autoSystem: "Автоматически (система)",
      custom: "Пользовательский",
      sectionTitle: "Визуальная тема",
      sectionSubtitle: "10 готовых палитр с режимом системы.",
      openGalleryA11y: "Открыть галерею тем",
      galleryTitle: "Галерея тем",
      gallerySubtitle: (activeLabel) => `Активная: ${activeLabel} · меняйте с живым предпросмотром`,
    },
    tracking: {
      title: "Отслеживание игр",
      subtitle: "Можно включить или выключить отслеживание игр. Нужен хотя бы один выбор.",
      lockNotice: (remaining) => `Self-Exclusion активен — осталось ${remaining}. Изменения заблокированы.`,
      toggleHint: "Включить / выключить отслеживание",
      toggleA11y: (label) => `Отслеживание ${label}`,
      inlineWarning: "Должен остаться хотя бы один выбор.",
      saveLabel: "Сохранить",
      savingLabel: "Сохранение",
    },
    sections: {
      protectionTitle: "Защита",
      protectionSubtitle: "Self-exclusion, окна риска и уведомления.",
      supportTitle: "Поддержка и помощь",
      supportSubtitle: "Быстрый доступ при кризисе и инструменты поддержки.",
      legalTitle: "Конфиденциальность и юридическое",
      legalSubtitle: "Политики, ограничения и использование данных.",
      devTitle: "Разработчик",
    },
  },
  fil: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Risk Windows", icon: "time", route: "/risk-windows" },
        { label: "Mga Notification", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Network ng Suporta", icon: "people", route: "/support" },
        { label: "SMS Spam Detector", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "I-export ang Data", icon: "download", route: "/data-export" },
        { label: "Patakaran sa Privacy", icon: "lock-closed", route: "/privacy" },
        { label: "Mga Tuntunin ng Paggamit", icon: "document-text", route: "/terms" },
        { label: "Mga Limitasyon", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostics", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Naka-lock",
      lockMessage: (remaining) => `Aktibo ang Self-Exclusion — ${remaining} ang natitira.`,
      minSelectionTitle: "Kailangan ng Pagpili",
      minSelectionMessage: "Hindi bababa sa isang addiction ang dapat manatiling napili.",
      savedTitle: "Nai-save",
      savedMessage: "Na-update ang gambling tracking.",
      errorTitle: "Error",
      errorMessage: "Hindi ma-save ang mga setting.",
    },
    header: {
      loadingAccessibility: "Naglo-load ng settings",
      back: "Bumalik",
      title: "Mga Setting",
    },
    theme: {
      autoSystem: "Awtomatiko (system)",
      custom: "Custom",
      sectionTitle: "Visual Theme",
      sectionSubtitle: "10 preset palette na may system-follow mode.",
      openGalleryA11y: "Buksan ang gallery ng theme",
      galleryTitle: "Gallery ng Theme",
      gallerySubtitle: (activeLabel) => `Aktibo: ${activeLabel} · palitan na may live preview`,
    },
    tracking: {
      title: "Pagsubaybay sa Sugal",
      subtitle: "Maaaring i-on o i-off ang pagsubaybay sa sugal. Kailangan ng kahit isa.",
      lockNotice: (remaining) => `Aktibo ang Self-Exclusion — ${remaining} natitira. Naka-lock ang pagbabago.`,
      toggleHint: "I-on / i-off ang pagsubaybay",
      toggleA11y: (label) => `Pagsubaybay sa ${label}`,
      inlineWarning: "Dapat mag-iwan ka ng kahit isang pagpili.",
      saveLabel: "I-save",
      savingLabel: "Sini-save",
    },
    sections: {
      protectionTitle: "Proteksyon",
      protectionSubtitle: "Self-exclusion, risk windows at notifications.",
      supportTitle: "Suporta at Tulong",
      supportSubtitle: "Mabilis na access sa krisis at mga support tools.",
      legalTitle: "Privacy at Legal",
      legalSubtitle: "Mga patakaran, limitasyon at paggamit ng data.",
      devTitle: "Developer",
    },
  },
  sv: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Riskfönster", icon: "time", route: "/risk-windows" },
        { label: "Aviseringar", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Stödnätverk", icon: "people", route: "/support" },
        { label: "SMS-spamdetektor", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Exportera mina data", icon: "download", route: "/data-export" },
        { label: "Sekretesspolicy", icon: "lock-closed", route: "/privacy" },
        { label: "Användarvillkor", icon: "document-text", route: "/terms" },
        { label: "Begränsningar", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostik", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Låst",
      lockMessage: (remaining) => `Self-Exclusion aktiv — ${remaining} kvar.`,
      minSelectionTitle: "Val krävs",
      minSelectionMessage: "Minst ett beroende måste förbli valt.",
      savedTitle: "Sparad",
      savedMessage: "Spelspårning uppdaterad.",
      errorTitle: "Fel",
      errorMessage: "Inställningarna kunde inte sparas.",
    },
    header: {
      loadingAccessibility: "Laddar inställningar",
      back: "Tillbaka",
      title: "Inställningar",
    },
    theme: {
      autoSystem: "Automatiskt (system)",
      custom: "Anpassad",
      sectionTitle: "Visuellt tema",
      sectionSubtitle: "10 förinställda paletter med systemläge.",
      openGalleryA11y: "Öppna temagalleri",
      galleryTitle: "Temagalleri",
      gallerySubtitle: (activeLabel) => `Aktivt: ${activeLabel} · byt med liveförhandsvisning`,
    },
    tracking: {
      title: "Spelspårning",
      subtitle: "Du kan aktivera eller inaktivera spelspårning. Minst ett val krävs.",
      lockNotice: (remaining) => `Self-Exclusion aktiv — ${remaining} kvar. Ändringar låsta.`,
      toggleHint: "Aktivera / inaktivera spårning",
      toggleA11y: (label) => `${label}-spårning`,
      inlineWarning: "Du måste behålla minst ett val.",
      saveLabel: "Spara",
      savingLabel: "Sparar",
    },
    sections: {
      protectionTitle: "Skydd",
      protectionSubtitle: "Self-exclusion, riskfönster och aviseringar.",
      supportTitle: "Support och hjälp",
      supportSubtitle: "Snabb åtkomst vid kris och stödverktyg.",
      legalTitle: "Sekretess och juridik",
      legalSubtitle: "Policyer, begränsningar och dataanvändning.",
      devTitle: "Utvecklare",
    },
  },
  fi: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Riskiajat", icon: "time", route: "/risk-windows" },
        { label: "Ilmoitukset", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Tukiverkosto", icon: "people", route: "/support" },
        { label: "SMS-roskapostin tunnistin", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Vie tietoni", icon: "download", route: "/data-export" },
        { label: "Tietosuojakäytäntö", icon: "lock-closed", route: "/privacy" },
        { label: "Käyttöehdot", icon: "document-text", route: "/terms" },
        { label: "Rajoitukset", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostiikka", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Lukittu",
      lockMessage: (remaining) => `Self-Exclusion aktiivinen — ${remaining} jäljellä.`,
      minSelectionTitle: "Valinta vaaditaan",
      minSelectionMessage: "Vähintään yksi riippuvuus on jäätävä valituksi.",
      savedTitle: "Tallennettu",
      savedMessage: "Pelaamisen seuranta päivitetty.",
      errorTitle: "Virhe",
      errorMessage: "Asetuksia ei voitu tallentaa.",
    },
    header: {
      loadingAccessibility: "Asetuksia ladataan",
      back: "Takaisin",
      title: "Asetukset",
    },
    theme: {
      autoSystem: "Automaattinen (järjestelmä)",
      custom: "Mukautettu",
      sectionTitle: "Visuaalinen teema",
      sectionSubtitle: "10 valmista palettia järjestelmätilalla.",
      openGalleryA11y: "Avaa teemagalleria",
      galleryTitle: "Teemagalleria",
      gallerySubtitle: (activeLabel) => `Aktiivinen: ${activeLabel} · vaihda live-esikatselulla`,
    },
    tracking: {
      title: "Pelaamisen seuranta",
      subtitle: "Voit ottaa pelaamisen seurannan käyttöön tai pois. Vähintään yksi valinta vaaditaan.",
      lockNotice: (remaining) => `Self-Exclusion aktiivinen — ${remaining} jäljellä. Muutokset lukittu.`,
      toggleHint: "Ota seuranta käyttöön / poista käytöstä",
      toggleA11y: (label) => `${label}-seuranta`,
      inlineWarning: "Sinun on pidettävä vähintään yksi valinta.",
      saveLabel: "Tallenna",
      savingLabel: "Tallennetaan",
    },
    sections: {
      protectionTitle: "Suoja",
      protectionSubtitle: "Self-exclusion, riskiajat ja ilmoitukset.",
      supportTitle: "Tuki ja apu",
      supportSubtitle: "Nopea pääsy kriisitilanteissa ja tukityökalut.",
      legalTitle: "Tietosuoja ja lakiasiat",
      legalSubtitle: "Käytännöt, rajoitukset ja tietojen käyttö.",
      devTitle: "Kehittäjä",
    },
  },
  nl: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Risicovensters", icon: "time", route: "/risk-windows" },
        { label: "Meldingen", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Steunnetwerk", icon: "people", route: "/support" },
        { label: "SMS-spam-detector", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Mijn gegevens exporteren", icon: "download", route: "/data-export" },
        { label: "Privacybeleid", icon: "lock-closed", route: "/privacy" },
        { label: "Gebruiksvoorwaarden", icon: "document-text", route: "/terms" },
        { label: "Beperkingen", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostiek", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Vergrendeld",
      lockMessage: (remaining) => `Self-Exclusion actief — ${remaining} resterend.`,
      minSelectionTitle: "Selectie vereist",
      minSelectionMessage: "Minimaal één verslaving moet geselecteerd blijven.",
      savedTitle: "Opgeslagen",
      savedMessage: "Gokvolging bijgewerkt.",
      errorTitle: "Fout",
      errorMessage: "Instellingen konden niet worden opgeslagen.",
    },
    header: {
      loadingAccessibility: "Instellingen worden geladen",
      back: "Terug",
      title: "Instellingen",
    },
    theme: {
      autoSystem: "Automatisch (systeem)",
      custom: "Aangepast",
      sectionTitle: "Visueel thema",
      sectionSubtitle: "10 voorinstellingen met systeemmodus.",
      openGalleryA11y: "Open themagalerij",
      galleryTitle: "Themagalerij",
      gallerySubtitle: (activeLabel) => `Actief: ${activeLabel} · wissel met live voorbeeld`,
    },
    tracking: {
      title: "Gokvolging",
      subtitle: "Je kunt gokvolging in- of uitschakelen. Minimaal één selectie vereist.",
      lockNotice: (remaining) => `Self-Exclusion actief — ${remaining} resterend. Wijzigingen vergrendeld.`,
      toggleHint: "Volgen aan / uit",
      toggleA11y: (label) => `${label}-volging`,
      inlineWarning: "Je moet minimaal één selectie behouden.",
      saveLabel: "Opslaan",
      savingLabel: "Bezig met opslaan",
    },
    sections: {
      protectionTitle: "Bescherming",
      protectionSubtitle: "Self-exclusion, risicovensters en meldingen.",
      supportTitle: "Ondersteuning en hulp",
      supportSubtitle: "Snelle toegang bij crisis en ondersteuningshulpmiddelen.",
      legalTitle: "Privacy en juridisch",
      legalSubtitle: "Beleid, beperkingen en datagebruik.",
      devTitle: "Ontwikkelaar",
    },
  },
  ja: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "リスクウィンドウ", icon: "time", route: "/risk-windows" },
        { label: "通知", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "サポートネットワーク", icon: "people", route: "/support" },
        { label: "SMSスパム検出", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "データをエクスポート", icon: "download", route: "/data-export" },
        { label: "プライバシーポリシー", icon: "lock-closed", route: "/privacy" },
        { label: "利用規約", icon: "document-text", route: "/terms" },
        { label: "制限事項", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "診断", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "ロック中",
      lockMessage: (remaining) => `Self-Exclusion有効 — 残り${remaining}。`,
      minSelectionTitle: "選択が必要",
      minSelectionMessage: "少なくとも1つの依存症を選択しておく必要があります。",
      savedTitle: "保存しました",
      savedMessage: "ギャンブル追跡が更新されました。",
      errorTitle: "エラー",
      errorMessage: "設定を保存できませんでした。",
    },
    header: {
      loadingAccessibility: "設定を読み込み中",
      back: "戻る",
      title: "設定",
    },
    theme: {
      autoSystem: "自動 (システム)",
      custom: "カスタム",
      sectionTitle: "ビジュアルテーマ",
      sectionSubtitle: "システムフォローモード付き10種類のプリセット。",
      openGalleryA11y: "テーマギャラリーを開く",
      galleryTitle: "テーマギャラリー",
      gallerySubtitle: (activeLabel) => `有効: ${activeLabel} · ライブプレビューで切替`,
    },
    tracking: {
      title: "ギャンブル追跡",
      subtitle: "ギャンブル追跡を有効・無効にできます。少なくとも1つの選択が必要です。",
      lockNotice: (remaining) => `Self-Exclusion有効 — 残り${remaining}。変更はロック中。`,
      toggleHint: "追跡を有効化 / 無効化",
      toggleA11y: (label) => `${label}追跡`,
      inlineWarning: "少なくとも1つの選択を残してください。",
      saveLabel: "保存",
      savingLabel: "保存中",
    },
    sections: {
      protectionTitle: "保護",
      protectionSubtitle: "Self-exclusion、リスクウィンドウ、通知設定。",
      supportTitle: "サポートとヘルプ",
      supportSubtitle: "危機時の迅速なアクセスとサポートツール。",
      legalTitle: "プライバシーと法律",
      legalSubtitle: "ポリシー、制限事項、データ利用。",
      devTitle: "開発者",
    },
  },
  id: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Jendela Risiko", icon: "time", route: "/risk-windows" },
        { label: "Notifikasi", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Jaringan Dukungan", icon: "people", route: "/support" },
        { label: "Detektor Spam SMS", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Ekspor Data Saya", icon: "download", route: "/data-export" },
        { label: "Kebijakan Privasi", icon: "lock-closed", route: "/privacy" },
        { label: "Syarat Penggunaan", icon: "document-text", route: "/terms" },
        { label: "Batasan", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Diagnostik", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Terkunci",
      lockMessage: (remaining) => `Self-Exclusion aktif — sisa ${remaining}.`,
      minSelectionTitle: "Pilihan Diperlukan",
      minSelectionMessage: "Setidaknya satu kecanduan harus tetap dipilih.",
      savedTitle: "Disimpan",
      savedMessage: "Pelacakan judi telah diperbarui.",
      errorTitle: "Kesalahan",
      errorMessage: "Pengaturan tidak dapat disimpan.",
    },
    header: {
      loadingAccessibility: "Memuat pengaturan",
      back: "Kembali",
      title: "Pengaturan",
    },
    theme: {
      autoSystem: "Otomatis (sistem)",
      custom: "Kustom",
      sectionTitle: "Tema Visual",
      sectionSubtitle: "10 palet preset dengan mode ikut sistem.",
      openGalleryA11y: "Buka galeri tema",
      galleryTitle: "Galeri Tema",
      gallerySubtitle: (activeLabel) => `Aktif: ${activeLabel} · ganti dengan preview langsung`,
    },
    tracking: {
      title: "Pelacakan Judi",
      subtitle: "Kamu bisa mengaktifkan atau menonaktifkan pelacakan judi. Setidaknya satu pilihan diperlukan.",
      lockNotice: (remaining) => `Self-Exclusion aktif — sisa ${remaining}. Perubahan terkunci.`,
      toggleHint: "Aktifkan / nonaktifkan pelacakan",
      toggleA11y: (label) => `Pelacakan ${label}`,
      inlineWarning: "Kamu harus mempertahankan setidaknya satu pilihan.",
      saveLabel: "Simpan",
      savingLabel: "Menyimpan",
    },
    sections: {
      protectionTitle: "Perlindungan",
      protectionSubtitle: "Self-exclusion, jendela risiko dan notifikasi.",
      supportTitle: "Dukungan dan Bantuan",
      supportSubtitle: "Akses cepat saat krisis dan alat dukungan.",
      legalTitle: "Privasi dan Hukum",
      legalSubtitle: "Kebijakan, batasan dan penggunaan data.",
      devTitle: "Pengembang",
    },
  },
  th: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "หน้าต่างความเสี่ยง", icon: "time", route: "/risk-windows" },
        { label: "การแจ้งเตือน", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "เครือข่ายสนับสนุน", icon: "people", route: "/support" },
        { label: "ตัวตรวจจับสแปม SMS", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "ส่งออกข้อมูลของฉัน", icon: "download", route: "/data-export" },
        { label: "นโยบายความเป็นส่วนตัว", icon: "lock-closed", route: "/privacy" },
        { label: "ข้อกำหนดการใช้งาน", icon: "document-text", route: "/terms" },
        { label: "ข้อจำกัด", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "การวินิจฉัย", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "ล็อก",
      lockMessage: (remaining) => `Self-Exclusion ทำงานอยู่ — เหลือ ${remaining}`,
      minSelectionTitle: "ต้องเลือก",
      minSelectionMessage: "ต้องเลือกการเสพติดอย่างน้อยหนึ่งอย่าง",
      savedTitle: "บันทึกแล้ว",
      savedMessage: "อัปเดตการติดตามการพนันแล้ว",
      errorTitle: "ข้อผิดพลาด",
      errorMessage: "ไม่สามารถบันทึกการตั้งค่าได้",
    },
    header: {
      loadingAccessibility: "กำลังโหลดการตั้งค่า",
      back: "ย้อนกลับ",
      title: "การตั้งค่า",
    },
    theme: {
      autoSystem: "อัตโนมัติ (ระบบ)",
      custom: "กำหนดเอง",
      sectionTitle: "ธีมภาพ",
      sectionSubtitle: "10 พาเล็ตพร้อมโหมดตามระบบ",
      openGalleryA11y: "เปิดแกลเลอรีธีม",
      galleryTitle: "แกลเลอรีธีม",
      gallerySubtitle: (activeLabel) => `ใช้งาน: ${activeLabel} · เปลี่ยนพร้อมพรีวิวสด`,
    },
    tracking: {
      title: "การติดตามการพนัน",
      subtitle: "คุณสามารถเปิดหรือปิดการติดตามการพนันได้ ต้องเลือกอย่างน้อยหนึ่งรายการ",
      lockNotice: (remaining) => `Self-Exclusion ทำงานอยู่ — เหลือ ${remaining} การเปลี่ยนแปลงถูกล็อก`,
      toggleHint: "เปิด / ปิด การติดตาม",
      toggleA11y: (label) => `การติดตาม ${label}`,
      inlineWarning: "คุณต้องเก็บไว้อย่างน้อยหนึ่งรายการ",
      saveLabel: "บันทึก",
      savingLabel: "กำลังบันทึก",
    },
    sections: {
      protectionTitle: "การป้องกัน",
      protectionSubtitle: "Self-exclusion, หน้าต่างความเสี่ยง และการแจ้งเตือน",
      supportTitle: "สนับสนุนและช่วยเหลือ",
      supportSubtitle: "เข้าถึงเร็วในยามวิกฤต และเครื่องมือสนับสนุน",
      legalTitle: "ความเป็นส่วนตัวและกฎหมาย",
      legalSubtitle: "นโยบาย ข้อจำกัด และการใช้ข้อมูล",
      devTitle: "นักพัฒนา",
    },
  },
  hi: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "रिस्क विंडोज़", icon: "time", route: "/risk-windows" },
        { label: "नोटिफिकेशन", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "सहायता नेटवर्क", icon: "people", route: "/support" },
        { label: "SMS स्पैम डिटेक्टर", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "मेरा डेटा निर्यात करें", icon: "download", route: "/data-export" },
        { label: "गोपनीयता नीति", icon: "lock-closed", route: "/privacy" },
        { label: "उपयोग की शर्तें", icon: "document-text", route: "/terms" },
        { label: "सीमाएँ", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "डायग्नोस्टिक्स", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "लॉक",
      lockMessage: (remaining) => `Self-Exclusion सक्रिय — ${remaining} शेष।`,
      minSelectionTitle: "चयन आवश्यक",
      minSelectionMessage: "कम से कम एक लत चयनित रहनी चाहिए।",
      savedTitle: "सहेजा गया",
      savedMessage: "जुआ ट्रैकिंग अपडेट हुई।",
      errorTitle: "त्रुटि",
      errorMessage: "सेटिंग्स सहेजी नहीं जा सकीं।",
    },
    header: {
      loadingAccessibility: "सेटिंग्स लोड हो रही हैं",
      back: "वापस",
      title: "सेटिंग्स",
    },
    theme: {
      autoSystem: "स्वचालित (सिस्टम)",
      custom: "अनुकूल",
      sectionTitle: "विज़ुअल थीम",
      sectionSubtitle: "सिस्टम-फॉलो मोड के साथ 10 प्रीसेट पैलेट।",
      openGalleryA11y: "थीम गैलरी खोलें",
      galleryTitle: "थीम गैलरी",
      gallerySubtitle: (activeLabel) => `सक्रिय: ${activeLabel} · लाइव प्रीव्यू से बदलें`,
    },
    tracking: {
      title: "जुआ ट्रैकिंग",
      subtitle: "तुम जुआ ट्रैकिंग को सक्षम या अक्षम कर सकते हो। कम से कम एक चयन आवश्यक।",
      lockNotice: (remaining) => `Self-Exclusion सक्रिय — ${remaining} शेष। बदलाव लॉक हैं।`,
      toggleHint: "ट्रैकिंग चालू / बंद",
      toggleA11y: (label) => `${label} ट्रैकिंग`,
      inlineWarning: "तुम्हें कम से कम एक चयन बनाए रखना होगा।",
      saveLabel: "सहेजें",
      savingLabel: "सहेजा जा रहा",
    },
    sections: {
      protectionTitle: "सुरक्षा",
      protectionSubtitle: "Self-exclusion, रिस्क विंडोज़ और नोटिफिकेशन।",
      supportTitle: "समर्थन और सहायता",
      supportSubtitle: "संकट में त्वरित पहुँच और सहायता उपकरण।",
      legalTitle: "गोपनीयता और कानूनी",
      legalSubtitle: "नीतियाँ, सीमाएँ और डेटा उपयोग।",
      devTitle: "डेवलपर",
    },
  },
  km: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "បង្អួចហានិភ័យ", icon: "time", route: "/risk-windows" },
        { label: "ការជូនដំណឹង", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "បណ្តាញគាំទ្រ", icon: "people", route: "/support" },
        { label: "ឧបករណ៍ស្វែងរក SMS Spam", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "នាំចេញទិន្នន័យរបស់ខ្ញុំ", icon: "download", route: "/data-export" },
        { label: "គោលការណ៍ឯកជនភាព", icon: "lock-closed", route: "/privacy" },
        { label: "លក្ខខណ្ឌប្រើប្រាស់", icon: "document-text", route: "/terms" },
        { label: "ការកំណត់", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "ការវិនិច្ឆ័យ", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "ចាក់សោ",
      lockMessage: (remaining) => `Self-Exclusion សកម្ម — នៅសល់ ${remaining}។`,
      minSelectionTitle: "ត្រូវការការជ្រើសរើស",
      minSelectionMessage: "យ៉ាងហោចណាស់ការញៀនមួយត្រូវនៅជ្រើសរើស។",
      savedTitle: "បានរក្សាទុក",
      savedMessage: "ការតាមដានល្បែងត្រូវបានធ្វើបច្ចុប្បន្នភាព។",
      errorTitle: "កំហុស",
      errorMessage: "មិនអាចរក្សាទុកការកំណត់ទេ។",
    },
    header: {
      loadingAccessibility: "កំពុងផ្ទុកការកំណត់",
      back: "ត្រឡប់",
      title: "ការកំណត់",
    },
    theme: {
      autoSystem: "ស្វ័យប្រវត្តិ (ប្រព័ន្ធ)",
      custom: "ផ្ទាល់ខ្លួន",
      sectionTitle: "រូបរាងមើល",
      sectionSubtitle: "10 paletes ដែលមានរបៀបតាមប្រព័ន្ធ។",
      openGalleryA11y: "បើកវិចិត្រសាលរូបរាង",
      galleryTitle: "វិចិត្រសាលរូបរាង",
      gallerySubtitle: (activeLabel) => `សកម្ម: ${activeLabel} · ប្តូរជាមួយការមើលផ្ទាល់`,
    },
    tracking: {
      title: "ការតាមដានល្បែង",
      subtitle: "អ្នកអាចបើកឬបិទការតាមដានល្បែង។ ត្រូវការការជ្រើសរើសយ៉ាងហោចណាស់មួយ។",
      lockNotice: (remaining) => `Self-Exclusion សកម្ម — នៅសល់ ${remaining}។ ការផ្លាស់ប្តូរត្រូវបានចាក់សោ។`,
      toggleHint: "បើក / បិទ ការតាមដាន",
      toggleA11y: (label) => `ការតាមដាន ${label}`,
      inlineWarning: "អ្នកត្រូវរក្សាការជ្រើសរើសយ៉ាងហោចណាស់មួយ។",
      saveLabel: "រក្សាទុក",
      savingLabel: "កំពុងរក្សាទុក",
    },
    sections: {
      protectionTitle: "ការការពារ",
      protectionSubtitle: "Self-exclusion, បង្អួចហានិភ័យ និងការជូនដំណឹង។",
      supportTitle: "ការគាំទ្រ និងជំនួយ",
      supportSubtitle: "ការចូលប្រើលឿនក្នុងវិបត្តិ និងឧបករណ៍គាំទ្រ។",
      legalTitle: "ឯកជនភាព និងច្បាប់",
      legalSubtitle: "គោលការណ៍ ការកំណត់ និងការប្រើទិន្នន័យ។",
      devTitle: "អ្នកអភិវឌ្ឍ",
    },
  },
  el: {
    links: {
      protection: [
        { label: "Self-Exclusion", icon: "lock-closed", route: "/self-exclusion" },
        { label: "Παράθυρα Κινδύνου", icon: "time", route: "/risk-windows" },
        { label: "Ειδοποιήσεις", icon: "notifications", route: "/notifications" },
      ],
      support: [
        { label: "SOS", icon: "alert-circle", route: "/sos" },
        { label: "Δίκτυο Στήριξης", icon: "people", route: "/support" },
        { label: "Ανιχνευτής SMS Spam", icon: "flask", route: "/sms-filter" },
      ],
      legal: [
        { label: "Εξαγωγή δεδομένων μου", icon: "download", route: "/data-export" },
        { label: "Πολιτική Απορρήτου", icon: "lock-closed", route: "/privacy" },
        { label: "Όροι Χρήσης", icon: "document-text", route: "/terms" },
        { label: "Περιορισμοί", icon: "information-circle", route: "/limitations" },
      ],
      dev: [{ label: "Διαγνωστικά", icon: "construct", route: "/diagnostics" }],
    },
    toast: {
      lockTitle: "Κλειδωμένο",
      lockMessage: (remaining) => `Self-Exclusion ενεργό — απομένουν ${remaining}.`,
      minSelectionTitle: "Απαιτείται επιλογή",
      minSelectionMessage: "Τουλάχιστον μία εξάρτηση πρέπει να παραμείνει επιλεγμένη.",
      savedTitle: "Αποθηκεύτηκε",
      savedMessage: "Η παρακολούθηση τζόγου ενημερώθηκε.",
      errorTitle: "Σφάλμα",
      errorMessage: "Οι ρυθμίσεις δεν μπόρεσαν να αποθηκευτούν.",
    },
    header: {
      loadingAccessibility: "Φόρτωση ρυθμίσεων",
      back: "Πίσω",
      title: "Ρυθμίσεις",
    },
    theme: {
      autoSystem: "Αυτόματο (σύστημα)",
      custom: "Προσαρμοσμένο",
      sectionTitle: "Οπτικό θέμα",
      sectionSubtitle: "10 προεπιλεγμένες παλέτες με λειτουργία συστήματος.",
      openGalleryA11y: "Άνοιγμα γκαλερί θεμάτων",
      galleryTitle: "Γκαλερί Θεμάτων",
      gallerySubtitle: (activeLabel) => `Ενεργό: ${activeLabel} · αλλαγή με ζωντανή προεπισκόπηση`,
    },
    tracking: {
      title: "Παρακολούθηση Τζόγου",
      subtitle: "Μπορείς να ενεργοποιήσεις ή να απενεργοποιήσεις την παρακολούθηση τζόγου. Απαιτείται τουλάχιστον μία επιλογή.",
      lockNotice: (remaining) => `Self-Exclusion ενεργό — απομένουν ${remaining}. Οι αλλαγές κλειδωμένες.`,
      toggleHint: "Ενεργοποίηση / απενεργοποίηση παρακολούθησης",
      toggleA11y: (label) => `Παρακολούθηση ${label}`,
      inlineWarning: "Πρέπει να διατηρήσεις τουλάχιστον μία επιλογή.",
      saveLabel: "Αποθήκευση",
      savingLabel: "Αποθηκεύεται",
    },
    sections: {
      protectionTitle: "Προστασία",
      protectionSubtitle: "Self-exclusion, παράθυρα κινδύνου και ειδοποιήσεις.",
      supportTitle: "Υποστήριξη και βοήθεια",
      supportSubtitle: "Γρήγορη πρόσβαση σε κρίση και εργαλεία υποστήριξης.",
      legalTitle: "Απόρρητο και Νομικά",
      legalSubtitle: "Πολιτικές, περιορισμοί και χρήση δεδομένων.",
      devTitle: "Προγραμματιστής",
    },
  },
};

export function getSettingsLocale(language: Language): SettingsText {
  return SETTINGS_LOCALES[language] ?? SETTINGS_LOCALES.en;
}
