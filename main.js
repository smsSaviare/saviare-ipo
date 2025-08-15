
/* === CONFIG === */
const scriptURL = "https://script.google.com/macros/s/AKfycbyYxKo88EvsBXTEW7VkGDXmbKmRqNik_-EdzsvKWnNEwiR_ro6E-VPSSi2lvoPnCVqu/exec";

/* === Bienvenida: fade-out automático, no bloquea UI === */
const welcome = document.getElementById('welcomeOverlay');
setTimeout(() => {
  if (welcome) {
    welcome.classList.add('fade-out');
    setTimeout(() => (welcome.style.display = 'none'), 900);
  }
}, 2800);
setTimeout(() => { if (welcome) welcome.style.display = 'none'; }, 5000);

/* === Overlay de progreso === */
const overlay = document.getElementById('overlay');
const bar = document.getElementById('bar');
const percent = document.getElementById('percent');
function showOverlay(){ overlay.style.display = 'flex'; }
function hideOverlay(){ overlay.style.display = 'none'; bar.style.width = '0%'; percent.textContent = '0%'; }
function setProgress(p){ bar.style.width = p + '%'; percent.textContent = p + '%'; }

/* === Lector de archivos a base64 === */
function readFileAsBase64(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* === Envío del formulario === */
document.getElementById('ipoForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const form = e.target;

  // Validar checkbox
  if(!document.getElementById('acepto').checked){
    alert('Debe aceptar los términos y condiciones.');
    return;
  }

  const filesInput = document.getElementById('files');

  // Validaciones de tamaño
  let totalSize = 0;
  for(const f of filesInput.files) totalSize += f.size;
  if(totalSize > 15*1024*1024){
    alert('El total de adjuntos supera 15 MB.');
    return;
  }

  showOverlay();

  // Convertir archivos a base64 con progreso
  const files = [];
  let uploaded = 0;
  const maxEnc = Math.max(totalSize,1);
  for(const f of filesInput.files){
    if(f.size > 10*1024*1024){ alert(`El archivo "${f.name}" excede 10 MB y se omitirá.`); continue; }
    const dataUrl = await readFileAsBase64(f);
    files.push({ name:f.name, mimeType:f.type || 'application/octet-stream', base64:dataUrl.split(',')[1] });
    uploaded += f.size;
    const pct = Math.min(80, Math.round((uploaded/maxEnc)*80));
    setProgress(pct);
  }

  const payload = {
    fechaPeligro: form.fechaPeligro.value || '',
    lugar: form.lugar.value || '',
    base: form.base.value || '',
    nombre: form.nombre.value || '',
    cargo: form.cargo.value || '',
    descripcion: form.descripcion.value || '',
    terminos: document.getElementById('acepto').checked ? 'Sí' : 'No',
    files
  };

  setProgress(90);

  try{
    await fetch(scriptURL,{ method:'POST', mode:'no-cors', body:JSON.stringify(payload) });
    setProgress(100);
    setTimeout(()=>{
      hideOverlay();
      alert('✅ ¡Reporte enviado!');
      form.reset();
    },600);
  } catch(err){
    console.error(err);
    hideOverlay();
    alert('❌ Error al enviar el reporte. Revisa tu conexión.');
  }
});
