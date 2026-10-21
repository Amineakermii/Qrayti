const $ = id => document.getElementById(id);
const translations = {
  en: {
    skip:'Skip to content',portal:'Teacher workspace',eyebrow:'KNOWLEDGE WORTH SHARING',welcome:'Your lessons. A little closer to every student.',intro:'Share your teaching resources with Qrayti students. Send your files and follow their review in a space of your own.',step1:'Choose a subject and add your files',step2:'The owner reviews each submission',step3:'Approved resources become available to students',enter:'Enter your workspace',inviteHint:'Use the personal invitation sent to you by the Qrayti owner.',invitation:'Invitation link or token',inviteReady:'Your invitation is ready. Select Continue to enter.',privacy:'Keep this invitation private. Anyone with the link can enter as you. Do not share it publicly.',continue:'Continue',contact:'Need an invitation or a fresh link? Contact the Qrayti owner through the channel where you received your invitation.',workspaceTitle:'Share what you know.',reviewNote:'Every file is reviewed by the owner before it becomes available to students.',logout:'Sign out',sharingAs:'SHARING AS',identityHelp:'These details were recorded by the owner. To correct them, contact the owner through your invitation channel.',uploadTab:'Upload courses',submissionsTab:'My submissions',destination:'Course destination',licence:'Licence',year:'Year',semester:'Semester',track:'Track',subject:'Subject',propose:'Propose a missing subject',proposeName:'Proposed subject name',proposeHint:'The owner will choose the final catalog subject before approval.',category:'Category',cours:'Course',td:'Tutorial (TD)',tp:'Practical (TP)',exams:'Exams',resume:'Summary',group:'Group (optional)',title:'Course title',titleHint:'You can adjust each file’s title in the list below.',topic:'Chapter or note (optional)',addFiles:'Add your files',chooseFiles:'Choose files from your device',fileHint:'PDF, DOCX, PPTX, JPEG, PNG, WebP · Up to 25 MiB each · 10 files per selection',rights:'I confirm that I own these materials or have permission to share them, and they are not an unauthorized copy of a paid book.',privateUntil:'Your files stay private until approval.',submit:'Send for review',goodToKnow:'BEFORE YOU SEND',usefulTitle:'Clear resources. Easier learning.',usefulText:'Choose the right subject and a title that helps students understand the lesson. Share only materials you have permission to distribute.',limitsTitle:'Your upload limits',reset:'Daily limits reset at midnight UTC.',submissionHint:'Follow review decisions and the owner’s feedback here.',refresh:'Refresh',footer:'Shared by teachers. Reviewed by the owner.',dark:'Dark mode',light:'Light mode',pending:'Pending review',approved:'Approved',rejected:'Rejected',ready:'Ready to send',uploading:'Uploading',checking:'Preparing upload',failed:'Upload failed',retry:'Retry',remove:'Remove',fileTitle:'File title',download:'Download my file',empty:'Your submissions will appear here after you send your first file.',feedback:'Owner feedback',submitted:'Submitted',reviewed:'Reviewed',expired:'Your session has expired or access has changed. Your unfinished files and form are kept on this page. Enter a new invitation to continue.',inviteRequired:'Enter the invitation link or token sent by the owner.',network:'Could not reach Qrayti. Check your connection and try again.',requestFailed:'The request could not be completed. Please try again.',noFiles:'Choose at least one supported file before sending.',unsupported:'Unsupported format. Choose PDF, DOCX, PPTX, JPEG, PNG or WebP.',oversize:'Each file must be no larger than 25 MiB.',emptyFile:'Empty files cannot be submitted.',tooMany:'Choose no more than 10 files at a time.',titleRequired:'Give each file a readable title.',retryAt:'Try again after',loading:'Loading your submissions…',optionsFailed:'Course choices could not be loaded. Use Refresh choices to try again.',refreshChoices:'Refresh choices',limitSummary:'25 MiB per file · 20 files / 250 MiB per UTC day · 500 MiB awaiting approval',usage:'Used today',files:'files',outstanding:'Awaiting approval',progress:'Upload progress',confirmed:'Received for review. Approval is required before students can access this file.',newIdentity:'You entered with a different invitation. Check the destination and retry any unfinished files when ready.',signedOut:'You have signed out.',select:'Choose',leave:'Uploads are unfinished.',rightsRequired:'Confirm your permission to share these files.'
  },
  fr: {
  "skip": "Aller au contenu",
  "portal": "Le coin des enseignants",
  "eyebrow": "UN COURS PARTAGÉ, UN DÉCLIC DE PLUS",
  "welcome": "Vos cours ont beaucoup à offrir.",
  "intro": "Un espace tout simple pour partager vos ressources avec les étudiants. Vous apportez le savoir, on s’occupe de lui faire une place.",
  "step1": "Vous choisissez la matière",
  "step2": "On vérifie vos fichiers ensemble",
  "step3": "Les étudiants en profitent",
  "enter": "Bienvenue chez vous !",
  "inviteHint": "Votre petit coin Qrayti vous attend. Entrez avec votre invitation personnelle.",
  "invitation": "Votre lien ou code d’invitation",
  "inviteReady": "Votre invitation est prête. On y va ?",
  "privacy": "Ce lien est votre clé personnelle : toute personne qui le possède peut entrer en votre nom. Gardez-le pour vous.",
  "continue": "C’est parti",
  "contact": "Besoin d’une invitation ? Contactez la personne qui vous a invité sur Qrayti.",
  "workspaceTitle": "On partage un peu de savoir ?",
  "reviewNote": "Ajoutez vos cours à votre rythme. Ils seront vérifiés avant d’être proposés aux étudiants.",
  "logout": "Se déconnecter",
  "sharingAs": "RAVI DE VOUS RETROUVER",
  "identityHelp": "Une information à corriger ? Un petit message à votre contact Qrayti suffit.",
  "uploadTab": "Partager un cours",
  "submissionsTab": "Mes envois",
  "destination": "Faisons une place à votre cours",
  "licence": "Licence",
  "year": "Année",
  "semester": "Semestre",
  "track": "Parcours",
  "subject": "Matière",
  "propose": "Ma matière n’est pas encore ici",
  "proposeName": "Nom de la nouvelle matière",
  "proposeHint": "Nous vérifierons son classement avant la publication.",
  "category": "Type de ressource",
  "cours": "Cours",
  "td": "Travaux dirigés (TD)",
  "tp": "Travaux pratiques (TP)",
  "exams": "Examens",
  "resume": "Résumé",
  "group": "Groupe (facultatif)",
  "title": "Un titre pour votre cours",
  "titleHint": "Vous pourrez aussi personnaliser le titre de chaque fichier.",
  "topic": "Chapitre ou petit mot (facultatif)",
  "addFiles": "À vos fichiers !",
  "chooseFiles": "Choisir des fichiers",
  "fileHint": "PDF, DOCX, PPTX, JPEG, PNG, WebP · 25 Mo maximum par fichier · 10 fichiers par sélection",
  "rights": "Je suis propriétaire de ces ressources ou j’ai l’autorisation de les partager. Ce ne sont pas des copies non autorisées de livres payants.",
  "privateUntil": "Rien n’est public avant notre validation.",
  "submit": "Envoyer pour vérification",
  "goodToKnow": "LE PETIT CONSEIL QRAYTI",
  "usefulTitle": "Un titre clair, ça change tout.",
  "usefulText": "Une matière bien choisie et un titre précis : vos étudiants vous remercieront. Partagez uniquement les ressources que vous avez le droit de diffuser.",
  "limitsTitle": "Votre espace de partage",
  "reset": "Les limites quotidiennes se réinitialisent à minuit UTC.",
  "submissionHint": "C’est ici que vous retrouvez vos cours et nos retours.",
  "refresh": "Actualiser",
  "footer": "Un peu de votre savoir. Beaucoup pour les étudiants.",
  "dark": "Mode nuit",
  "light": "Mode jour",
  "pending": "En vérification",
  "approved": "Publié",
  "rejected": "À revoir",
  "ready": "Prêt à partir",
  "uploading": "Envoi en cours",
  "checking": "On prépare l’envoi",
  "failed": "Envoi interrompu",
  "retry": "Réessayer",
  "remove": "Retirer",
  "fileTitle": "Titre du fichier",
  "download": "Télécharger mon fichier",
  "empty": "Votre premier cours vous attend ! Partagez un fichier et retrouvez son parcours ici.",
  "feedback": "Notre retour",
  "submitted": "Envoyé le",
  "reviewed": "Vérifié le",
  "expired": "Votre accès a expiré ou a changé. Vos fichiers et votre formulaire sont toujours ici. Entrez une nouvelle invitation pour continuer.",
  "inviteRequired": "Ajoutez le lien ou le code d’invitation reçu de Qrayti.",
  "network": "La connexion fait une petite pause. Vérifiez votre réseau et réessayez.",
  "requestFailed": "L’envoi n’a pas abouti. Réessayez dans un instant.",
  "noFiles": "Choisissez au moins un fichier avant de l’envoyer.",
  "unsupported": "Format non pris en charge. Choisissez PDF, DOCX, PPTX, JPEG, PNG ou WebP.",
  "oversize": "Chaque fichier doit faire 25 Mo maximum.",
  "emptyFile": "Ce fichier est vide. Choisissez la version complète.",
  "tooMany": "Choisissez jusqu’à 10 fichiers à la fois.",
  "titleRequired": "Ajoutez un titre à chaque fichier.",
  "retryAt": "Nouvel essai possible après",
  "loading": "On retrouve vos envois…",
  "optionsFailed": "Les matières ne se chargent pas pour le moment. Réessayez avec « Actualiser les matières ».",
  "refreshChoices": "Actualiser les matières",
  "limitSummary": "25 Mo par fichier · 20 fichiers / 250 Mo par jour UTC · 500 Mo non publiés",
  "usage": "Aujourd’hui",
  "files": "fichiers",
  "outstanding": "Non publiés",
  "progress": "Progression de l’envoi",
  "confirmed": "Bien reçu, merci ! Votre cours part en vérification avant sa publication.",
  "newIdentity": "Vous utilisez une autre invitation. Vérifiez la matière avant de reprendre vos envois.",
  "signedOut": "À bientôt ! Vous êtes déconnecté.",
  "select": "Choisir",
  "leave": "Il reste des fichiers à envoyer.",
  "rightsRequired": "Confirmez votre autorisation de partager ces ressources.",
  "mascotNote": "Merci, prof !",
  "welcomeTag": "C’est plus chouette à plusieurs.",
  "greeting": "Bonjour",
  "sharingSteps": "Votre cours, en trois petits pas",
  "optional": "Les petits détails (facultatif)",
  "noticeClose": "Fermer le message"
}
};

Object.assign(translations.en, {
  "portal": "The teachers’ corner",
  "eyebrow": "A SHARED LESSON. A LITTLE LIGHTBULB MOMENT.",
  "welcome": "Good things happen when you share.",
  "intro": "A little space for your big ideas. Share your teaching resources with students—we’ll help them find their place.",
  "enter": "Make yourself at home.",
  "inviteHint": "Your own Qrayti corner is waiting. Come in with your personal invitation.",
  "continue": "Let’s go",
  "workspaceTitle": "Let’s share a little knowledge.",
  "reviewNote": "Take your time. Add your resources, and we’ll review them before students can see them.",
  "identityHelp": "Something needs updating? A quick message to your Qrayti contact will do.",
  "uploadTab": "Share a course",
  "destination": "Find a home for your course",
  "addFiles": "Bring your files along",
  "goodToKnow": "A LITTLE QRAYTI TIP",
  "usefulTitle": "A clear title goes a long way.",
  "confirmed": "Thanks, we’ve got it! Your course is ready for review before it goes public.",
  "empty": "Your first course starts here. Share a file and follow its journey in this space.",
  "mascotNote": "You’re making a difference!",
  "welcomeTag": "Better when we share.",
  "greeting": "Hello",
  "sharingSteps": "Three little steps. One helpful course.",
  "optional": "The little details (optional)",
  "noticeClose": "Dismiss message"
});

let language = document.documentElement.lang === 'en' ? 'en' : 'fr';
let invitation = new URLSearchParams(location.hash.slice(1)).get('invite') || '';
let teacher = null, lastTeacherId = null, subjects = [], submissions = [], usage = null;
let queue = [], busy = false, optionsReady = false, sessionEpoch = 0, listRequest = 0;
const t = key => translations[language][key] || key;
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const size = bytes => `${(Number(bytes || 0) / 1048576).toLocaleString(language, {maximumFractionDigits: 1})} MiB`;
const date = value => value ? new Date(value).toLocaleString(language, {dateStyle:'medium',timeStyle:'short'}) : '';
function savePreference(key, value) { try { localStorage.setItem(key, value); } catch { /* Optional preference persistence. */ } }
function notice(message) { $('notice').textContent = message; $('notice').hidden = !message; }
function errorText(error) { return `${error.message || t('requestFailed')}${error.retryAt ? ` · ${t('retryAt')} ${date(error.retryAt)}` : ''}`; }

function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = 'ltr';
  document.title = `Qrayti · ${t('portal')}`;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === language)));
  const toggle = document.querySelector('[data-theme-toggle]');
  const isDark = document.documentElement.dataset.theme === 'dark';
  toggle.setAttribute('aria-label', t('dark'));
  toggle.setAttribute('aria-checked', String(isDark));
  toggle.title = t(isDark ? 'light' : 'dark');
  $('limits').textContent = t('limitSummary');
  updateSubjectLabels(); renderQueue(); renderSubmissions(); renderUsage();
  document.dispatchEvent(new CustomEvent('qrayti:language-changed'));
}
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  language = button.dataset.lang; savePreference('qrayti-teacher-language', language); applyLanguage();
}));
document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme; savePreference('qrayti-teacher-theme', theme); applyLanguage();
});

function expireSession() {
  teacher = null; sessionEpoch++; listRequest++;
  $('workspace').hidden = true; $('login').hidden = false;
  $('identity').replaceChildren(); submissions = []; renderSubmissions();
  $('loginHint').textContent = t('expired');
  $('inviteReady').hidden = true; $('invitationLabel').hidden = false;
  $('invitation').focus();
}
async function request(path, options = {}, handleExpiry = true) {
  let response;
  try { response = await fetch(`/api/teachers/${path}`, {credentials:'same-origin',cache:'no-store',...options}); }
  catch { throw new Error(t('network')); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && handleExpiry) expireSession();
    throw Object.assign(new Error(body.error || t('requestFailed')), {status:response.status,retryAt:body.retryAt});
  }
  return body;
}
function readInvitation(value) {
  const text = value.trim();
  if (!text.includes('://')) return text;
  try { return new URLSearchParams(new URL(text).hash.slice(1)).get('invite') || ''; }
  catch { return ''; }
}
async function enterWorkspace(data) {
  const nextTeacher = data.teacher;
  if (!nextTeacher?.id) throw new Error(t('requestFailed'));
  if (lastTeacherId && lastTeacherId !== nextTeacher.id) {
    queue = queue.filter(item => !item.done);
    queue.forEach(item => { item.requestId = crypto.randomUUID(); item.meta = null; item.status = 'ready'; item.error = ''; });
    notice(t('newIdentity'));
  }
  teacher = nextTeacher; lastTeacherId = teacher.id; const epoch = ++sessionEpoch;
  $('identity').replaceChildren(node('strong', teacher.name), node('span', [teacher.university,teacher.institution].filter(Boolean).join(' · ')));
  $('login').hidden = true; $('workspace').hidden = false; $('loginError').textContent = '';
  renderQueue();
  await Promise.allSettled([loadOptions(epoch), loadSubmissions(epoch)]);
}
$('loginForm').addEventListener('submit', async event => {
  event.preventDefault(); const token = readInvitation($('invitation').value) || invitation;
  if (!token) { $('loginError').textContent = t('inviteRequired'); $('invitation').focus(); return; }
  const button = event.currentTarget.querySelector('button'); button.disabled = true; $('loginError').textContent = '';
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const data = await request('session', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}, false);
    invitation = ''; $('invitation').value = ''; await enterWorkspace(data);
  } catch (error) { $('loginError').textContent = errorText(error); $('invitationLabel').hidden = false; $('inviteReady').hidden = true; }
  finally { button.disabled = false; }
});
$('logout').addEventListener('click', async () => {
  if (busy) return;
  $('logout').disabled = true;
  try {
    await request('session', {method:'DELETE'});
    queue = []; invitation = ''; lastTeacherId = null; usage = null;
    $('uploadForm').reset(); $('fileError').textContent = ''; $('uploadError').textContent = '';
    expireSession(); $('loginHint').textContent = t('signedOut'); renderQueue(); notice('');
  } catch (error) { notice(errorText(error)); }
  finally { $('logout').disabled = false; }
});

const destinationKeys = ['licence','year','semester','track'];
function filteredSubjects(until = destinationKeys.length) {
  return subjects.filter(subject => destinationKeys.slice(0, until).every(key => String(subject[key] ?? '') === $(key).value));
}
function fillSelect(element, values) {
  const oldValue = element.value;
  element.replaceChildren(...values.map(value => new Option(value || '—', value)));
  if (values.includes(oldValue)) element.value = oldValue;
}
function fillDestinations(start = 0) {
  for (let index = start; index < destinationKeys.length; index++) {
    const key = destinationKeys[index];
    fillSelect($(key), [...new Set(filteredSubjects(index).map(subject => String(subject[key] ?? '')))]);
  }
  const oldSubject = $('subjectId').value;
  $('subjectId').replaceChildren(...filteredSubjects().map(subject => new Option(subject.subjectName, subject.subjectId)), new Option(t('propose'), '__proposed'));
  if ([...$('subjectId').options].some(option => option.value === oldSubject)) $('subjectId').value = oldSubject;
  updateSubjectLabels(); toggleProposedSubject();
}
function updateSubjectLabels() {
  [...$('subjectId').options].forEach(option => {
    const subject = filteredSubjects().find(item => item.subjectId === option.value);
    option.textContent = option.value === '__proposed' ? t('propose') : subject?.subjectName || option.textContent;
  });
}
function toggleProposedSubject() {
  const proposed = $('subjectId').value === '__proposed';
  $('proposedSubject').hidden = !proposed; $('subjectName').required = proposed;
}
destinationKeys.forEach((key,index) => $(key).addEventListener('change', () => fillDestinations(index + 1)));
$('subjectId').addEventListener('change', toggleProposedSubject);
async function loadOptions(epoch = sessionEpoch) {
  optionsReady = false; updateControls();
  try {
    const data = await request('options');
    if (epoch !== sessionEpoch || !teacher) return;
    subjects = data.subjects || []; fillDestinations(); optionsReady = subjects.length > 0;
    if (!optionsReady) throw new Error(t('optionsFailed'));
  } catch (error) {
    if (epoch !== sessionEpoch || !teacher) return;
    notice(t('optionsFailed'));
    const retry = node('button', t('refreshChoices')); retry.type = 'button';
    retry.addEventListener('click', async () => { notice(''); await loadOptions(); });
    $('notice').append(' ', retry);
  } finally { updateControls(); }
}

function renderUsage() {
  $('usage').textContent = usage ? `${t('usage')}: ${usage.dailyFiles || 0} ${t('files')} · ${size(usage.dailyBytes)}. ${t('outstanding')}: ${size(usage.outstandingBytes)}.` : '';
}
async function loadSubmissions(epoch = sessionEpoch) {
  const sequence = ++listRequest;
  $('refresh').disabled = true;
  try {
    const data = await request('submissions');
    if (epoch !== sessionEpoch || sequence !== listRequest || !teacher) return;
    submissions = data.items || []; usage = data.usage; renderSubmissions(); renderUsage();
  } catch (error) { if (epoch === sessionEpoch && teacher) notice(errorText(error)); }
  finally { if (sequence === listRequest) $('refresh').disabled = false; }
}
function renderSubmissions() {
  const list = $('submissionList'); list.replaceChildren();
  if (!submissions.length) { list.append(node('div', t('empty'), 'empty')); return; }
  for (const item of submissions) {
    const card = node('article', undefined, 'card submission-card');
    const head = node('div', undefined, 'head'), title = node('div');
    title.append(node('h3', item.displayName), node('p', [item.meta?.subjectName,item.originalName,size(item.size)].filter(Boolean).join(' · ')));
    const status = ['pending','approved','rejected'].includes(item.status) ? item.status : 'pending';
    head.append(title, node('span', t(status), `badge ${status}`)); card.append(head);
    card.append(node('p', `${t('submitted')}: ${date(item.createdAt)}${item.reviewedAt ? ` · ${t('reviewed')}: ${date(item.reviewedAt)}` : ''}`));
    if (item.feedback) card.append(node('p', `${t('feedback')}: ${item.feedback}`, 'feedback'));
    const link = node('a', t('download')); link.href = `/api/teachers/submissions/${encodeURIComponent(item.id)}/file`; link.download = item.originalName || 'course';
    card.append(link); list.append(card);
  }
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  const list = button.dataset.view === 'submissions';
  $('uploadView').hidden = list; $('submissionsView').hidden = !list;
  document.querySelectorAll('[data-view]').forEach(tab => { if (tab === button) tab.setAttribute('aria-current','page'); else tab.removeAttribute('aria-current'); });
  if (list) loadSubmissions();
}));
$('refresh').addEventListener('click', () => loadSubmissions());

function fileError(file) {
  if (!/\.(pdf|docx|pptx|jpe?g|png|webp)$/i.test(file.name)) return t('unsupported');
  if (!file.size) return t('emptyFile');
  if (file.size > 26214400) return t('oversize');
  return '';
}
$('files').addEventListener('change', () => {
  const files = [...$('files').files]; $('fileError').textContent = '';
  if (files.length > 10) { $('fileError').textContent = t('tooMany'); return; }
  const errors = [];
  for (const file of files) {
    const problem = fileError(file);
    if (problem) { errors.push(`${file.name}: ${problem}`); continue; }
    if (queue.some(item => !item.done && item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) continue;
    queue.push({file,requestId:crypto.randomUUID(),title:files.length === 1 && $('displayName').value.trim() ? $('displayName').value.trim() : file.name.replace(/\.[^.]+$/, ''),status:'ready',progress:0,error:'',meta:null,done:false});
  }
  $('fileError').textContent = errors.join(' '); renderQueue();
});
function renderQueue() {
  $('queue').replaceChildren();
  queue.forEach(item => {
    const row = node('div', undefined, 'queue-item'); row.dataset.queueId = item.requestId;
    row.append(node('p', `${item.file.name} · ${size(item.file.size)}`, 'file-name'));
    const label = node('label', t('fileTitle')), input = node('input'); input.value = item.title; input.maxLength = 180;
    input.disabled = !!item.meta || busy || item.done;
    input.addEventListener('input', () => { item.title = input.value; }); label.append(input); row.append(label);
    const actions = node('div', undefined, 'queue-actions');
    actions.append(node('span', t(item.status), `badge ${item.status}`));
    if (!item.done && !busy) {
      const buttons = node('div');
      if (item.status === 'failed') {
        const retry = node('button', t('retry')); retry.type = 'button'; retry.dataset.retry = item.requestId;
        retry.addEventListener('click', () => startUploads([item])); buttons.append(retry);
      }
      const remove = node('button', t('remove')); remove.type = 'button';
      remove.addEventListener('click', () => { queue = queue.filter(entry => entry !== item); renderQueue(); }); buttons.append(remove); actions.append(buttons);
    }
    row.append(actions);
    if (item.status === 'uploading' || item.status === 'checking') {
      const progress = node('progress'); progress.max = 100; progress.value = item.progress; progress.setAttribute('aria-label', `${t('progress')}: ${item.file.name}`); row.append(progress);
    }
    if (item.error) row.append(node('p', item.error, 'error'));
    $('queue').append(row);
  });
  updateControls();
}
function updateControls() {
  $('uploadFields').disabled = busy;
  $('submitUpload').disabled = busy || !teacher || !optionsReady;
  $('logout').disabled = busy;
}
function metadata(item) {
  const subject = filteredSubjects().find(entry => entry.subjectId === $('subjectId').value);
  return {licence:$('licence').value,year:$('year').value,semester:$('semester').value,track:$('track').value,
    subjectId:subject?.subjectId || '',subjectName:subject?.subjectName || $('subjectName').value.trim(),category:$('category').value,
    displayName:item.title.trim(),group:$('group').value.trim(),topic:$('topic').value.trim()};
}
function putFile(id, item) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open('PUT', `/api/teachers/upload?id=${encodeURIComponent(id)}`);
    xhr.timeout = 300000; xhr.setRequestHeader('Content-Type','application/octet-stream');
    xhr.upload.onprogress = event => {
      item.progress = event.lengthComputable ? Math.round(event.loaded / event.total * 100) : 0;
      const progress = document.querySelector(`[data-queue-id="${item.requestId}"] progress`);
      if (progress) progress.value = item.progress;
    };
    xhr.onload = () => {
      let body = {}; try { body = JSON.parse(xhr.responseText); } catch { /* Non-JSON server error. */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else { if (xhr.status === 401) expireSession(); reject(Object.assign(new Error(body.error || t('requestFailed')), {status:xhr.status,retryAt:body.retryAt})); }
    };
    xhr.onerror = xhr.ontimeout = xhr.onabort = () => reject(new Error(t('network')));
    xhr.send(item.file);
  });
}
async function startUploads(items) {
  if (busy || !teacher || !optionsReady) return;
  $('uploadError').textContent = '';
  if (!$('uploadForm').reportValidity()) return;
  if (!$('rightsConfirmed').checked) { $('uploadError').textContent = t('rightsRequired'); return; }
  if (!items.length) { $('uploadError').textContent = t('noFiles'); $('uploadError').focus(); return; }
  if (items.some(item => !item.title.trim())) { $('uploadError').textContent = t('titleRequired'); $('uploadError').focus(); return; }
  busy = true; renderQueue();
  for (const item of items) {
    if (!teacher) break;
    try {
      item.meta ||= metadata(item); item.error = ''; item.status = 'checking'; renderQueue();
      const reservation = await request('upload', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:item.file.name,declaredSize:item.file.size,meta:item.meta,requestId:item.requestId,rightsConfirmed:true})});
      let status = reservation.status;
      if (status === 'reserved') {
        item.status = 'uploading'; item.progress = 0; renderQueue();
        const result = await putFile(reservation.id, item); status = result.item?.status;
      }
      if (!['pending','approved','rejected'].includes(status)) throw new Error(t('requestFailed'));
      item.status = status; item.done = true; item.progress = 100;
      notice(t('confirmed'));
    } catch (error) { item.status = 'failed'; item.error = errorText(error); }
    renderQueue();
  }
  busy = false; renderQueue();
  if (teacher) await loadSubmissions();
}
$('uploadForm').addEventListener('submit', event => { event.preventDefault(); startUploads(queue.filter(item => !item.done)); });
window.addEventListener('beforeunload', event => { if (queue.some(item => !item.done)) { event.preventDefault(); event.returnValue = ''; } });

$('invitationLabel').hidden = !!invitation; $('inviteReady').hidden = !invitation;
applyLanguage();
// An invitation always needs explicit consent, even if a prior session exists.
if (!invitation) request('session', {}, false).then(enterWorkspace).catch(error => {
  if (error.status !== 401) $('loginError').textContent = errorText(error);
});
