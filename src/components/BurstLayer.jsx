export function burstAt(x, y, count = 12) {
  const shapes = ['♡', '♥', '✿'];
  for (let i = 0; i < count; i += 1) {
    const element = document.createElement('span');
    element.className = 'burst';
    element.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.setProperty('--x', `${Math.random() * 220 - 110}px`);
    element.style.setProperty('--y', `${Math.random() * -170 - 30}px`);
    element.style.fontSize = `${15 + Math.random() * 14}px`;
    element.style.color = Math.random() > 0.5 ? '#b65363' : '#efb7c8';
    document.body.appendChild(element);
    window.setTimeout(() => element.remove(), 1200);
  }
}
