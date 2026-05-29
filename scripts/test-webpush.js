try {
  const wp = require('web-push');
  console.log('web-push cargado correctamente', typeof wp.generateVAPIDKeys);
} catch(e) {
  console.error('Error cargando web-push:', e);
}
