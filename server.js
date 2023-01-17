const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const Router = require('koa-router');
const cors = require('koa2-cors');
const WS = require('ws');
const path = require('path');
const Storage = require('./Storage');


const app = new Koa();
const router = new Router();

// Body Parsers
app.use(koaBody({
  json: true, text: true, urlencoded: true, multipart: true,
}));

// CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Routers
app.use(router.routes()).use(router.allowedMethods());

// Files Directory
const filesDir = path.join(__dirname, '/files');
app.use(koaStatic(filesDir));

// Starting Server
const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

// DATABASE
const dB = [
  {id: '111', message: 'Котойога', date: Date.now() - 500000000, geo: '', type: 'text'},
  {id: '112', message: 'cat.jpg', date: Date.now() - 250000000, geo: '', type: 'image'},
  {id: '113', message: 'Впервые идея создания этого направления йоги возникла на Западе. Не так давно практику этих занятий переняли в странах постсоветского пространства. Во многих городах открываются котокафе и фитнес-центры, где проводятся занятия йогой вместе с кошками. На Западе люди приходят со своими питомцами, тогда как у нас больше распространена практика, при которой кошки, взятые из приюта, живут в йога-центрах. Часто люди имеют возможность забрать домой понравившегося питомца – так многие коты находят новых хозяев.', date: Date.now() - 450000000, geo: '', type: 'text'},
  {id: '114', message: 'Преимущества котойоги', date: Date.now() - 400000000, geo: '', type: 'text'},
  {id: '115', message: 'Котойога является ответвлением хатха-йоги – пути совершенствования духа через совершенство физическое. Чтобы прочувствовать весь смысл занятий с четвероногими, нужно настроиться на определенную волну, попытаться войти в контакт с животными. Только тогда будет достигнут максимальный эффект, порой превосходящий все ожидания. Питомцы, свободно разгуливающие по залу, способны незначительно ограничить выполнение некоторых асан. Животное может разлечься на коврике для занятий или даже взобраться на спину или другие части тела. Тревожить кошку в таких случаях не принято, иначе ускользнет вся суть занятий котойогой. В целом комплекс упражнений не имеет каких-либо особенностей – асаны выполняются в обычном режиме. Нужно лишь чувствовать кошку, а она будет чувствовать вас, передавая свою энергию.', date: Date.now() - 400000000, geo: '', type: 'text'},
  {id: '116', message: 'Как правило, на одного человека приходится в среднем две кошки. Так, в зале, рассчитанном на 10 человек, находятся обычно около 20 кошек.', date: Date.now() - 350000000, geo: '41.013800, 28.949700', type: 'text'},
  {id: '117', message: 'Котойога – сравнительно новое направление, но оно уже покорило сердца многих. Каждому человеку стоит хотя бы раз попробовать такую практику, которая способна подарить совершенно новый, ни на что не похожий опыт и уникальные впечатления.', date: Date.now(), geo: '', type: 'text'},
  {id: '117g7i9m-y7gf-3t4y-66i8-uzumymw666ad', message: 'cat_yoga.pdf', date: Date.now() - 100000000, geo: '', type: 'file'},
  {id: '118', message: 'Время Scatman', date: Date.now(), geo: '', type: 'text'},
  {id: '221', message: 'cat_scatman.mp4', date: Date.now() - 200000000, type: 'video'},
  {id: '222', message: 'Время Мяу', date: Date.now(), geo: '', type: 'text'},
  {id: '223', message: 'meow.mp3', date: Date.now() - 150000000, geo: '41.013800, 28.949700', type: 'audio'},
  {id: '222gdak6-io98-6i9i-ip0y-hesoyam100he', message: 'Ссылка на изпользованный источник https://101kote.ru/stati/kotoyoga.html, ссылка на видео https://www.youtube.com/watch?v=dCkz1fgZLQo', date: Date.now() - 300000000, geo: '', type: 'text'},


];
const category = {
  links: [
    { name: 'https://101kote.ru/stati/kotoyoga.html', messageId: '117g7i9m-y7gf-3t4y-66i8-uzumymw666ad' },
    { name: 'https://www.youtube.com/watch?v=dCkz1fgZLQo', messageId: '117g7i9m-y7gf-3t4y-66i8-uzumymw666ad' },
  ],
  image: [
    { name: 'cat.jpg', messageId: '112' },
  ],
  video: [
    { name: 'cat_scatman.mp4', messageId: '221' },
  ],
  audio: [
    { name: 'meow.mp3', messageId: '223' },
  ],
  file: [
    { name: 'cat_yoga.pdf', messageId: '117g7i9m-y7gf-3t4y-66i8-uzumymw666ad' },
  ],
};
const favourites = new Set(['112', '117g7i9m-y7gf-3t4y-66i8-uzumymw666ad', '221']);


const clients = [];
wsServer.on('connection', (ws) => {
  clients.push(ws);
  const storage = new Storage(dB, category, favourites, filesDir, ws, clients);
  storage.init();

  router.post('/upload', async (ctx) => {
    storage.loadFile(ctx.request.files.file, ctx.request.body.geo).then((result) => {
      storage.wsAllSend({ ...result, event: 'file' });
    });
    ctx.response.status = 204;
  });

  ws.on('close', () => {
    const wsIndex = clients.indexOf(ws);
    if (wsIndex !== -1) {
      clients.splice(wsIndex, 1);
    }
  });
});

server.listen(port, () => console.log('Server started'));