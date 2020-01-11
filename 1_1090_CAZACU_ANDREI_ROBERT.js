class Element {
    constructor(img, width, height, x = 0, y = 0) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

// TODO fix generateCanvas and generate layers
// TODO resize all canvases accordingly

var canvas;
var ctx;

var elements = [];

var layers = [];

var layerNo = 1;

var currentEff = null;
var currentEl = null;

let el;

var penColor = 'gray';
var backgroundColor = 'gray';

var penBtn;
var backgroundBtn;

var tempColor = null;

var control;
var isShown = false;
var pickerCanvas;
var ctxPicker;
var colorPickerDiv;
var pixelColor;

var restorePath;

document.addEventListener('DOMContentLoaded', (event) => {
    // operating with the color pickers
    penBtn = document.querySelector('#penBtn');
    backgroundBtn = document.querySelector('#backgroundBtn');

    pickerCanvas = document.querySelector('#picker');
    ctxPicker = pickerCanvas.getContext('2d');
    colorPickerDiv = document.querySelector('.colorpicker');

    let imgColorWheel = new Image();
    imgColorWheel.src = './lib/colorwheel.png';
    imgColorWheel.onload = () => {
        ctxPicker.drawImage(imgColorWheel, 0, 0, imgColorWheel.width, imgColorWheel.height);
    }

    pickerCanvas.addEventListener('mousemove', (ev) => {
        if (isShown) {
            let rect = {
                x: pickerCanvas.getBoundingClientRect().left,
                y: pickerCanvas.getBoundingClientRect().top
            };

            let x = ev.x - rect.x;
            let y = ev.y - rect.y;

            let imgData = ctxPicker.getImageData(x, y, 1, 1);
            let pixel = imgData.data;

            pixelColor = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            control.style.backgroundColor = pixelColor;

            if (control.innerText === 'Background color') {
                let l;
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].id == 'background')
                        l = layers[i];
                }

                let ct = l.canvas.getContext('2d');
                ct.fillStyle = pixelColor;
                ct.fillRect(0, 0, l.canvas.width, l.canvas.height);

            } else {
                ctx.strokeStyle = pixelColor;
            }
        }
    })

    pickerCanvas.addEventListener('click', (ev) => {
        isShown = !isShown;
        colorPickerDiv.style.display = 'none';
    })

    pickerCanvas.addEventListener('mouseout', (ev) => {
        if (isShown) {
            control.style.backgroundColor = tempColor;

            if (tempColor != '')
                pixelColor = tempColor;
            else
                pixelColor = 'darkgray';

            if (control.innerText == 'Background color') {
                let l;
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].id == 'background')
                        l = layers[i];
                }

                let ct = l.canvas.getContext('2d');
                ct.fillStyle = pixelColor;
                ct.fillRect(0, 0, l.canvas.width, l.canvas.height);
            } else {
                if (tempColor)
                    ctx.strokeStyle = tempColor;
                else
                    ctx.strokeStyle = 'black';
            }
        }



        isShown = false;
        colorPickerDiv.style.display = 'none';
    })

    // TODO check this out
    canvas = document.querySelector('canvas');
    canvas.width = window.innerWidth - 250;
    canvas.height = window.innerHeight - 250;

    ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'black';

    let rect = {
        x: canvas.getBoundingClientRect().left,
        y: canvas.getBoundingClientRect().top
    }

    canvas.addEventListener('mousedown', (ev) => {
        console.log('mouse down');

        redraw();

        let animationId;

        let it = 0;

        let startX = ev.x - rect.x;
        let startY = ev.y - rect.y;

        let absX = ev.x - rect.x;
        let absY = ev.y - rect.y;

        let mouseMoveFunc = (ev) => {
            console.log('mouse move')

            let currX = ev.x - rect.x;
            let currY = ev.y - rect.y;

            let width = currX - absX;
            let height = currY - absY;

            let x = currX - startX;
            let y = currY - startY;

            if (currentEff && typeof (currentEff) === 'function') {
                if (currentEff.length == 6) {
                    currentEff(absX, absY, width, height, animationId, it++);
                } else if (currentEff.length == 4) {
                    currentEff(startX, startY, currX, currY);
                } else {
                    currentEff(x, y);
                }
            }

            if (currentEl.innerText != 'Draw rectangle') {
                startX = currX;
                startY = currY;
            }
        }

        document.addEventListener('mousemove', mouseMoveFunc);

        document.addEventListener('mouseup', (ev) => {
            console.log('mouse up');

            document.removeEventListener('mousemove', mouseMoveFunc);
            if (animationId)
                cancelAnimationFrame(animationId);
        })
    });
})

// TODO clearCanvas only works for top most canvas
function clearCanvas(ev) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    penBtn.style.backgroundColor = 'gray';
    ctx.strokeStyle = '#000';

    currentEl.style.backgroundColor = 'gray';
    currentEl.style.color = 'black';

    currentEl = null;
    currentEff = null;
}

// TODO needs rewriting
function savePhoto(ev) {
    let temp;
    let a = document.createElement('a');
    a.setAttribute('download', 'img.png');


    if (el) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = pixelColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(el.img, el.x, el.y, el.width, el.height);

        temp = canvas.toDataURL();
        a.setAttribute('href', temp);
        a.click();
        delete a;
    } else {
        let r = new Image();
        r.src = restorePath;

        r.addEventListener('load', (ev) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (pixelColor)
                ctx.fillStyle = pixelColor;
            else
                ctx.fillStyle = '#FFF';

            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(r, 0, 0);

            temp = canvas.toDataURL();

            a.setAttribute('href', temp);
            a.click();
            delete a;
        })
    }

    clearCanvas();
}

// it works for the latest selected canvas
function redraw() {
    let shownCanvas;

    for (let i = 0; i < layers.length; i++) {
        if (layers[i].element !== undefined && layers[i].shown === true) {
            el = layers[i].element;
            shownCanvas = layers[i].canvas;
        }
    }

    if (el) {
        let ct = shownCanvas.getContext('2d');

        ct.clearRect(0, 0, canvas.width, canvas.height);
        ct.drawImage(el.img, el.x, el.y, el.width, el.height);
    }

    animationId = requestAnimationFrame(redraw);
}

// it works 
function resize(x, y) {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].element !== undefined && layers[i].shown === true) {
            el = layers[i].element;
        }
    }

    if (el) {
        if (el.x + el.width + x < canvas.width && el.x + el.width + x > 50 && el.width + x > 50) {
            el.width += x;
        } else {
            if (el.x + el.width + x >= canvas.width) {
                el.width = canvas.width - el.x;
            } else {
                el.width = 50;
            }
        }

        if (el.y + el.height + y < canvas.height && el.y + el.height + y > 50 && el.height + y > 50) {
            el.height += y;
        } else {
            if (el.y + el.height + y >= canvas.height) {
                el.height = canvas.height - el.y;
            } else {
                el.height = 50;
            }
        }
    }
}

// works
function move(x, y) {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].element !== undefined && layers[i].shown === true) {
            el = layers[i].element;
        }
    }

    if (el) {
        if (el.x + el.width + x < canvas.width && el.x + el.width + x > 0 & el.x + x >= 0) {
            el.x += x;
        } else {
            if (el.x + el.width + x >= canvas.width) {
                el.x = canvas.width - el.width;
            } else {
                el.x = 0;
            }
        }

        if (el.y + el.height + y < canvas.height && el.y + el.height + y > 0 && el.y + y >= 0) {
            el.y += y;
        } else {
            if (el.y + el.height + y >= canvas.height) {
                el.y = canvas.height - el.height;
            } else {
                el.y = 0;
            }
        }
    }
}

// TODO choose a canvas
function drawLine(startX, startY, currX, currY) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    restorePath = canvas.toDataURL();
}


// TODO choose a canvas
function drawRectangle(startX, startY, width, height, animationId, it) {
    if (it != 0) {
        let restore = new Image();
        restore.src = restorePath;

        restore.addEventListener('load', (ev) => {
            cancelAnimationFrame(animationId);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeRect(startX, startY, width, height);
            restorePath = canvas.toDataURL();
        })
    } else {
        cancelAnimationFrame(animationId);

        ctx.strokeRect(startX, startY, width, height);
        restorePath = canvas.toDataURL();
    }
}

// it works
function changeEff(ev) {
    if (currentEl != ev.target) {
        if (currentEl) {
            disableEffect();
        }

        currentEl = ev.target;

        switch (ev.target.innerText) {
            case 'Resize':
                currentEff = resize;
                break;
            case 'Draw line':
                currentEff = drawLine;
                break;
            case 'Move':
                currentEff = move;
                break;
            case 'Draw rectangle':
                currentEff = drawRectangle;
                break;
            default:
                break;
        }

        enableEffect();
    } else {
        disableEffect();

        currentEl = null;
        currentEff = null;
    }
}

function disableEffect() {
    try {
        currentEl.style.backgroundColor = 'gray';
        currentEl.style.color = 'black';

        currentEl = null;
        currentEff = null;
    } catch {

    }
}

function enableEffect() {
    try {
        currentEl.style.backgroundColor = 'teal';
        currentEl.style.color = 'white';
    } catch {

    }
}

// no changes needed
function allowDrop(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

// it works now i think
function drop(event) {
    event.preventDefault();

    var files = event.dataTransfer.files;
    var file = files[0];

    if (file) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = (e) => {
            var img = new Image();
            img.src = e.target.result;
            img.onload = (ev) => {
                ctx.clearRect(0, 0, canvas.width, canvas.height, img.width, img.height);

                // adjusting image size to fit canvas
                if (img.width > canvas.width || img.height > canvas.height) {
                    var multiplier1, multiplier2;

                    multiplier1 = img.width / canvas.width;
                    multiplier2 = img.height / canvas.height;

                    var multiplier;

                    (multiplier1 > multiplier2) ? multiplier = multiplier1: multiplier = multiplier2;

                    img.width = (img.width / multiplier);
                    img.height = (img.height / multiplier);
                }

                let layer = generateCanvas();
                let ct = layer.canvas.getContext('2d');
                ct.drawImage(img, 0, 0, img.width, img.height);

                let el = new Element(img, img.width, img.height);
                elements.push(el);
                layer.element = el;
            }
        }
    }
}

// fully works
function changePenColor(ev) {
    disableEffect();

    control = ev.target;
    tempColor = control.style.backgroundColor;
    colorPickerDiv.style.display = 'block';
    isShown = true;
}

// done
function generateBackgroundCanvas() {
    let l = generateCanvas();
    l.innerText = 'Background';
    l.id = 'background';

    let photoEditor = document.querySelector('.photo-editor');
    photoEditor.prepend(l.canvas);

    layers.unshift(layers.pop());
}

// i think it works
function changeBackgroundColor(ev) {
    disableEffect();

    let ok = 0;
    for (let i = 0; i < layers.length; i++) {
        let l = layers[i];
        if (l.id == 'background') {
            ok = 1;

            if (!l.shown)
                showLayer(l);
        }
    }
    if (ok == 0)
        generateBackgroundCanvas();

    control = ev.target;
    tempColor = control.style.backgroundColor;
    colorPickerDiv.style.display = 'block';
    isShown = true;
}

// done
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 250;
    canvas.height = window.innerHeight - 250;

    for (l in layers) {
        let c = l.canvas;
        c.width = canvas.width;
        c.height = canvas.height;
    }
})

// done
function showLayer(layer) {
    let c = layer.canvas;
    c.style.display = 'inline';
    layer.shown = true;

    layer.style.backgroundColor = 'teal';
    layer.style.color = 'white';
}

// done
function hideLayer(layer) {
    let c = layer.canvas;
    c.style.display = 'none';
    layer.shown = false;

    layer.style.backgroundColor = 'gray';
    layer.style.color = 'black';
}

// done
function generateCanvas() {
    let mCanvas = document.createElement('canvas');
    let div = document.querySelector('.photo-editor');
    mCanvas.style.position = 'absolute';
    mCanvas.style.left = canvas.getBoundingClientRect().left + 'px';
    mCanvas.width = canvas.width;
    mCanvas.height = canvas.height;

    div.append(mCanvas);

    let layer = document.createElement('a');
    layer.layerNo = layerNo;
    layer.id = 'layer' + layerNo;
    layer.innerText = 'Layer ' + layerNo++;
    layer.canvas = mCanvas;
    layer.element = null;
    showLayer(layer);

    layer.onclick = function (ev) {
        let elm = ev.target;

        if (elm.shown)
            hideLayer(elm);
        else
            showLayer(elm);
    }

    document.querySelector('.layer-list').append(layer);

    layers.push(layer);

    return layer;
}