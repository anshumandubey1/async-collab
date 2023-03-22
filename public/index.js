const addToSlackButton = document.getElementById('addToSlack');
const generateSummaryButton = document.getElementById('generateSummary');
const summaryBox = document.getElementById('summaryBox');
const summaryParagraph = document.getElementById('summary');
const loading = document.querySelector('.loader')

generateSummaryButton.style.display = 'none';
summaryBox.style.display = 'none';
addToSlackButton.style.display = 'none';

const showError = (errorMessage) => {
  console.error(errorMessage)
}

generateSummaryButton.onclick = async () => {
  generateSummaryButton.style.display = 'none';
  loading.style.display = 'block'
  console.log('Trying to generate summary')
  const response = await fetch('/generateSummary', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      'authorization': localStorage.getItem('slackToken')
    },
    body: JSON.stringify({
      channels: localStorage.getItem('channels').split(',')
    })
  })
  const data = await response.text();
  console.log({data})
  summaryParagraph.innerText = data.trim();
  loading.style.display = 'none'
  // summaryParagraph.innerText = 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Minus iusto qui voluptatibus distinctio eos rem id quaerat eligendi, dolorem iure vero dolore veritatis velit expedita eum, harum blanditiis exercitationem? Nihil dolorum et rerum illum necessitatibus, veritatis ratione sit labore adipisci nemo provident. Mollitia praesentium reprehenderit nemo quod, eius cumque dignissimos! Fugiat aliquam quibusdam quasi dolor, vitae minus nostrum provident voluptate ullam deleniti quas beatae veritatis reprehenderit hic sunt corporis vel! Deserunt mollitia iste, ea, nam, similique sint dolorem ipsa sunt harum quisquam fuga cum totam! Numquam possimus maiores optio ratione qui, eius doloribus. Eius placeat possimus consectetur dolorem optio vitae?'
  summaryBox.style.display = 'block'
}

const getChannels = async () => {
  try {
    console.log('Trying to get channels')
    const response = await fetch('/channels', {
      headers: {
        'authorization': localStorage.getItem('slackToken')
      }
    })
    const data = await response.text();
    // const channels = data.map(x=>x.id).join(',');
    console.log({data})
    localStorage.setItem('channels', data)
    loading.style.display = 'none'
    generateSummaryButton.style.display = 'block';
  } catch (error) {
    showError(String(error))
  }
}

const main = () => {
  const params = new URLSearchParams(window.location.search);
  if(params.get('slackToken')) {
    localStorage.setItem('slackToken', params.get('slackToken'));
    history.replaceState(null, null, '/');
  }


  if(localStorage.getItem('slackToken')) {
    addToSlackButton.style.display = 'none'

    if(localStorage.getItem('channels')) {
      loading.style.display = 'none'
      generateSummaryButton.style.display = 'block';
    } else {
      getChannels();
    }
  } else {
    loading.style.display = 'none'
    addToSlackButton.style.display = 'block'
  }

}

main()

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let nodes = [];

class Node {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) {
      this.vx *= -1;
    }

    if (this.y < 0 || this.y > canvas.height) {
      this.vy *= -1;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2, false);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
  }
}

function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = Math.random() * 2 - 1;
    const vy = Math.random() * 2 - 1;

    nodes.push(new Node(x, y, vx, vy));
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].update();
    nodes[i].draw();

    for (let j = i + 1; j < nodes.length; j++) {
      const distance = Math.sqrt(
        (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2
      );

      if (distance < 100) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.closePath();
      }
    }
  }

  requestAnimationFrame(animate);
}

init();
animate();