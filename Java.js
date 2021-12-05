// Constantes
const body = document.body;
const postit = document.getElementById("postit");
const displayX = document.getElementById("x"); // Elementos que mostram as coordenadas atuais na tela
const displayY = document.getElementById("y");
const darkThemeSwitch = document.getElementById("theme");
const createEditable = document.createElement("textarea"); // Elemento editável para escrever
const minScale = 2; // Valores mínimo e máximo de zoom
const maxScale = 15;
const lineLength = 18; // Tamanho das linhas com separação de palavra
const maxLineLength = 22; // Tamanho das linhas independentemenete da separação
const maxLength = 130;
const lineStep = 25; // Espaçamento entre as linhas
const breakChar = "¢"; // Caractere usado na quebra
const highlightScaling = 2; // Aumento do tamanho do post-it ao selecionar
const gridLimit = 64; // Parâmetros da grade de fundo
const gridSize = 256;
const socket = new WebSocket('ws://localhost:8080'); // WebSocket para conexão com o servidor

// Variáveis
var imageWidth = window.innerWidth; //Tamanho do canvas
var imageHeight = window.innerHeight;
var canvas = null; // Variáveis nulas para inicialização e operação do canvas;
var ctx = null;
var bounds = null;
var postItArray = []; // Array onde vão ficar os elementos
var selectedPostIt = null;
var postItIndex = null;
var editPostIt = null;
var panX = 0; // "Pan" é o local do canvas infinito sendo mostrado na tela
var panY = 0;
var mouseX = 0; // Coordenadas do mouse
var mouseY = 0;
var oldMouseX = 0; // Coordenadas anteriores do mouse
var oldMouseY = 0;
var mouseHeld = false; // Detecta se o mouse continua apertado
var isCreate = false; // Modo de criação de post-its
var isDelete = false; // Modo de exclusão de post-its
var scale = 5; // Variável para manter contagem simples do zoom
var zoom = 1; // Nível de zoom atual (Possível fundir com scale?)
var postitSize = 200; // Tamanho do post-it
var breakCount = 0; // Contagem de caracteres para quebrar
var tempText; // Texto antes de ser quebrado
var isDarkTheme = false;
var isThemeSwitchPossible = true;

// Paleta de cores
var textColor = "#000000";
var gridColor = "#ececec";
var backgroundColor = "#f2f2f2";

function isServerReady(){setTimeout(function(){ // Esperar pela conexão com o servidor
  if (socket.readyState == 1){
    socket.send(JSON.stringify(["connect"]));
  } else {
    isServerReady();
  }
    console.log("Connecting...")
  }, 200);
}

socket.onmessage = ({data}) => { // Quando receber uma mensagem do servidor
  let info = JSON.parse(data);  // Transformar a mensagem em um array novamente
  switch (info[0]){ // Tipo de informação recebida
  case "text":
    postItArray[info[1]].text = info[2];
    break;
  case "move":
    postItArray[info[1]].x = info[2];
    postItArray[info[1]].y = info[3];
    break;
  case "array":
    postItArray = [];
    console.log(info);
    for(let i=0; i < info[1].length; i++){
      postItArray.push(
        new DraggablePostIt(info[1][i].x, info[1][i].y, info[1][i].size, info[1][i].text, info[1][i].hue)
      );
    };
    console.log(postItArray);
    break;
  }
  requestAnimationFrame(draw);
}

// Inicialização da página
window.onload = function () {
  body.addEventListener("wheel", checkScrollDirection); // Permite detectar scroll
  canvas = document.getElementById("canvas"); // Setup pro canvas
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  bounds = canvas.getBoundingClientRect();
  ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.font = "15px Arial";
  createEditable.id = "editable";
  isServerReady();
  requestAnimationFrame(draw);
};

// Quando a janela não está sendo mostrada
window.onunload = function () {
  canvas = null;
  ctx = null;
  bounds = null;
  selectedPostIt = null;
  postItIndex = null;
  postItArray = null;
};

// Atualizando os parâmetros da inicialização caso a janela seja redimensionada
window.onresize = function () {
  imageWidth = window.innerWidth; // Armazena o novo tamanho da janela e corrige a escala
  imageHeight = window.innerHeight;
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  ctx.textAlign = "center";
  ctx.font = "15px Arial";
  requestAnimationFrame(draw);
};

// O que acontece ao segurar o mouse
window.onmousedown = function (e) {
  mouseHeld = true;
  if (!selectedPostIt) {
    for (var i = postItArray.length - 1; i > -1; --i) {
      if (postItArray[i].isCollidingWidthPoint(mouseX + panX, mouseY + panY)) {
        //Detectando se o mouse colide com algum elemento
        selectedPostIt = postItArray[i];
        postItIndex = i;
        selectedPostIt.isSelected = true;
        requestAnimationFrame(draw);
        return;
      }
    }
    if (editPostIt != null) {
      textEdit();
    }
  }
};

// Executa com clique duplo
window.ondblclick = function (e) {
  if (isCreate == false) {
    if (!editPostIt) {
      for (var i = postItArray.length - 1; i > -1; --i) {
        if (
          postItArray[i].isCollidingWidthPoint(mouseX + panX, mouseY + panY)
        ) {
          // Detectando se o mouse colide com algum elemento
          if (isDelete == false) {
            editPostIt = postItArray[i]; // Isso muda o texto do post-it
            editPostItIndex = i;
            document.body.appendChild(createEditable); // Insere o elemento editável na página
            createEditable.style.filter =
              "hue-rotate(" + editPostIt.hue.toString() + "deg)";
            createEditable.style.font = (zoom * 15).toString() + "px Arial";
            createEditable.style.fontWeight = "bold";
            createEditable.style.top =
              String((editPostIt.y - panY) * zoom) + "px"; // Coloca o elemento editável no mesmo local do post-it
            createEditable.style.left =
              String((editPostIt.x - panX) * zoom) + "px";
            createEditable.style.width = String(editPostIt.size * zoom) + "px";
            createEditable.style.height = String(editPostIt.size * zoom) + "px";
            createEditable.value = editPostIt.text.join(" "); // Coloca o mesmo texto do post-it no elemento editável
          } else {
            postItArray.splice(i, 1); // Isso exclui o post-it do array
            postItIndex = i;
            socket.send(JSON.stringify(["array", postItArray]));
          }
          return;
        }
      }
    }
  } else {
    postItArray.push(
      new DraggablePostIt(mouseX + panX, mouseY + panY, postitSize, [
        "Novo post-it",
      ], Math.random() * 360)
    ); // Isso cria um novo post-it
    socket.send(JSON.stringify(["array", postItArray]));
    requestAnimationFrame(draw);
  }
};

// O que acontece ao mover o mouse
window.onmousemove = function (e) {
  mouseX = (e.clientX - bounds.left) * (imageWidth / window.innerWidth); // Calculando a posição do mouse levando em conta resolução e zoom
  mouseY = (e.clientY - bounds.top) * (imageHeight / window.innerHeight);
  if (mouseHeld) {
    if (!selectedPostIt) {
      panX += oldMouseX - mouseX; // Mudando o local mostrado quando o mouse é arrastado sem colidir com um elemento
      panY += oldMouseY - mouseY;
      displayX.innerText = Math.round(panX); // Mostra as coordenadas atuais arredondadas no elemento específico
      displayY.innerText = Math.round(panY);
    } else {
      if (createEditable != document.activeElement) {
        // Só executar caso o modo de edição não esteja ativo
        selectedPostIt.x = mouseX - selectedPostIt.size * 0.5 + panX; // Movendo o elemento quando o mouse está colidindo com ele
        selectedPostIt.y = mouseY - selectedPostIt.size * 0.5 + panY;
        socket.send(JSON.stringify(["move", postItIndex, selectedPostIt.x, selectedPostIt.y]));
      }
    }
  }
  oldMouseX = mouseX; // Guarda a última posição do mouse
  oldMouseY = mouseY;
  requestAnimationFrame(draw);
};

window.onmouseup = function (e) {
  // Executado ao soltar o mouse
  mouseHeld = false;
  if (selectedPostIt) {
    selectedPostIt.isSelected = false; // Remove a seleção da post-it caso se aplique
    selectedPostIt = null;
    postItIndex = null;
    socket.send(JSON.stringify(["array", postItArray]));
    requestAnimationFrame(draw);
  }
};

window.onkeydown = function (e) {
  if (e.key == "Enter") {
    if (editPostIt != null) {
      textEdit();
    }
  }
};

function replaceAt(string, index, replacement) {
  return (
    string.substr(0, index) +
    replacement +
    string.substr(index + replacement.length)
  );
}

function textEdit() {
  tempText = createEditable.value; // Pega o texto do elemento editável em uma variável
  tempText = tempText.substring(0, maxLength);
  for (var i = 0; i < tempText.length; i++) {
    // Loop para quebrar as linhas do texto
    let breakIncoming = false;
    let currentChar = tempText.charAt(i);
    breakCount++;
    if (breakCount >= lineLength) {
      breakIncoming = true;
    }
    if (breakIncoming && currentChar == " ") {
      // Só quebra em separação de palavras
      tempText = replaceAt(tempText, i, breakChar);
      breakIncoming = false;
      breakCount = 0;
    }
    if (breakCount >= maxLineLength) {
      // Depois de certo número de caracteres, quebra independente da separação de palavras
      tempText = replaceAt(tempText, i, breakChar);
      breakIncoming = false;
      breakCount = 0;
    }
  }
  breakIncoming = false;
  breakCount = 0;
  editPostIt.text = tempText.split(breakChar);
  createEditable.remove(); // Exclui o elemento editável
  socket.send(JSON.stringify(["text", editPostItIndex, editPostIt.text])); // Envia as alterações para o servidor em forma de string
  editPostIt = null; // Tira o post-it do modo de edição
  editPostItIndex = null;
}

function draw() {
  // Renderização do canvas (só renderiza elementos visíveis)
  ctx.fillStyle = backgroundColor; // Cor do background do canvas
  ctx.fillRect(0, 0, imageWidth, imageHeight);
  drawGrid();
  var postIt = null;
  var xMin = 0;
  var xMax = 0;
  var yMin = 0;
  var yMax = 0;
  for (var i = 0; i < postItArray.length; ++i) {
    postIt = postItArray[i];
    xMax = postIt.x + postIt.size - panX;
    xMin = postIt.x - panX - 2000;
    yMin = postIt.y - panY;
    yMax = postIt.y + postIt.size - panY;
    if (xMax > 0 && xMin < imageWidth && yMax > 0 && yMin < imageHeight) {
      // Detecta e renderiza apenas os post-its que aparecem na tela
      postIt.draw();
    }
  }
}

function drawGrid() {
  // Desenha a grade do background
  var gridScale,
    size,
    x,
    y = false;
  gridScale = gridSize;
  size = Math.max(canvas.width, canvas.height) / 1 + gridScale * 2;
  x = Math.floor(panX / gridScale) * gridScale;
  y = Math.floor(panY / gridScale) * gridScale;
  if (size / gridScale > gridLimit) {
    size = gridScale * gridLimit;
  }
  ctx.setTransform(1, 0, 0, 1, -panX, -panY);
  ctx.lineWidth = 2;
  ctx.strokeStyle = gridColor;
  ctx.beginPath();
  for (i = 0; i < size; i += gridScale) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + size);
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + size, y + i);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.stroke();
}

function checkScrollDirection(event) {
  // Aplica o zoom dependendo da direção do scroll
  if (checkScrollDirectionIsUp(event)) {
    if (scale > minScale) {
      scale--; // Se a direção do scroll for pra cima e não passar do limite de zoom, aumenta o zoom
      imageWidth -= window.innerWidth * 0.1;
      imageHeight -= window.innerHeight * 0.1;
      zoom = window.innerWidth / imageWidth;
      panX += mouseX * 0.1 * zoom * 0.9; // Ajuste do pan para acompanhar a posição do mouse no zoom
      panY += mouseY * 0.1 * zoom * 0.9; // Ajuste do pan para acompanhar a posição do mouse no zoom
    }
  } else {
    if (scale < maxScale) {
      scale++; // Se a direção do scroll for pra baixo e não passar do limite de zoom, diminui o zoom
      imageWidth += window.innerWidth * 0.1;
      imageHeight += window.innerHeight * 0.1;
      zoom = window.innerWidth / imageWidth;
      panX -= mouseX * 0.1 * zoom * 0.9; // Ajuste do pan para acompanhar a posição do mouse no zoom
      panY -= mouseY * 0.1 * zoom * 0.9; // Ajuste do pan para acompanhar a posição do mouse no zoom
    }
  }
  mouseX = (event.clientX - bounds.left) * (imageWidth / window.innerWidth); // Calculando a posição do mouse novamente, pois muda com o zoom
  mouseY = (event.clientY - bounds.top) * (imageHeight / window.innerHeight);
  displayX.innerText = Math.round(panX); // Mostra as coordenadas atuais arredondadas no elemento específico
  displayY.innerText = Math.round(panY);
  createEditable.remove(); // Exclui o elemento editável
  editPostIt = null; // Tira o post-it do modo de edição
  canvas.width = imageWidth; // Atualiza as dimensões e texto do canvas para se ajustarem ao novo zoom
  canvas.height = imageHeight;
  ctx.textAlign = "center";
  ctx.font = "15px Arial";
  requestAnimationFrame(draw);
}

function checkScrollDirectionIsUp(event) {
  // Detecta a direção do scroll
  if (event.wheelDelta) {
    return event.wheelDelta > 0; // Retorna true se o comando de scroll for positivo
  }
  return event.deltaY < 0; // Retorna false se o comando de scroll for negativo
}

function CreatePostItMode() {
  // Função para entrar no modo de criação de post-its
  isCreate = !isCreate;
  isDelete = false;
  if (isCreate) {
    document.body.style.cursor = "copy"; // Altera o cursor para indicar o modo de criação
  } else {
    document.body.style.cursor = "pointer";
  }
}

function DeletePostItMode() {
  // Função para entrar no modo de exclusão de post-its
  isDelete = !isDelete;
  isCreate = false;
  if (isDelete) {
    document.body.style.cursor = "crosshair"; // Altera o cursor para indicar o modo de exclusão
  } else {
    document.body.style.cursor = "pointer";
  }
}

function ChangeTheme() {
  // Muda as cores do site
  console.log(isThemeSwitchPossible);
  if (isThemeSwitchPossible) {
    if (!isDarkTheme) {
      textColor = "#000000";
      gridColor = "#181818";
      backgroundColor = "#141414";
      displayX.classList.remove("lightPan");
      displayY.classList.remove("lightPan");
      displayX.classList.add("darkPan");
      displayY.classList.add("darkPan");
      darkThemeSwitch.style.backgroundImage = "url('Assets/Light Post-it.png')";
    } else {
      textColor = "#000000";
      gridColor = "#ececec";
      backgroundColor = "#f2f2f2";
      displayX.classList.remove("darkPan");
      displayY.classList.remove("darkPan");
      displayX.classList.add("lightPan");
      displayY.classList.add("lightPan");
      darkThemeSwitch.style.backgroundImage = "url('Assets/Dark Post-it.png')";
    }
    isThemeSwitchPossible = false;
    setTimeout(function () {
      isThemeSwitchPossible = !isThemeSwitchPossible;
    }, 1000); // Tempo de espera para a troca de tema (Impossibilita problemas com epilepsia)
  }
  isDarkTheme = !isDarkTheme;
  requestAnimationFrame(draw);
}

class DraggablePostIt {
  // Classe para os post-its arrastáveis (O VSCode transformou em uma classe automaticamente, lembrar de pesquisar sobre em etapas futuras)
  constructor(x, y, size, text, hue) {
    this.x = x; // Coordenadas do post-it
    this.y = y;
    this.size = size; // Tamanho do post-it
    this.text = text; // Conteúdo do post-it
    this.hue = hue; // Variação de cor nos post-its
    this.isSelected = false; // Seleção e edit do post-it
  }
  isCollidingWidthPoint(x, y) {
    return (
      x > this.x &&
      x < this.x + this.size &&
      y > this.y &&
      y < this.y + this.size
    ); // Retorna true caso as coordenadas recebidas coincidam com as coordenadas ocupadas por um post-it
  }
  drag(newX, newY) {
    this.x = newX - this.size * 0.5;
    this.y = newY - this.size * 0.5;
  }
  draw() {
    ctx.filter = "hue-rotate(" + this.hue.toString() + "deg)"; // Adicionando filtro de cor
    if (this.isSelected && editPostIt == null) {
      ctx.drawImage(
        postit,
        this.x - panX - 5 * highlightScaling,
        this.y - panY - 5 * highlightScaling,
        this.size + 5 * highlightScaling * 2,
        this.size + 5 * highlightScaling * 2
      ); // Renderiza a imagem do post-it em destaque
      ctx.font = "bold 17px Arial";
    } else {
      ctx.drawImage(postit, this.x - panX, this.y - panY, this.size, this.size); // Renderiza a imagem do post-it padrão
      ctx.font = "bold 15px Arial";
    }
    ctx.filter = "none"; // Tirando filtro de cor
    ctx.fillStyle = textColor; // Cor do texto
    for (var i = 0; i < this.text.length; i++) {
      ctx.fillText(
        this.text[i],
        this.x + this.size * 0.5 - panX,
        this.y +
          this.size * 0.5 -
          panY +
          i * lineStep -
          ((this.text.length * lineStep) / 2 - (1 * lineStep) / 2),
        this.size
      ); // Preenche o post-it com texto (multilinha)
    }
  }
}
