export const generateMarkerSvg = ({ color, size }) =>
  `<svg height="${size}px" width="${size}px" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 0C3.13 0 0 3.13 0 7c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26C6 19.05 6.21 20 7 20s1-.95 1.25-1.5c.37-.81.7-1.51 1.17-2.26.96-1.53 2.21-2.85 3.16-4.4C13.5 10.37 14 8.74 14 7c0-3.87-3.13-7-7-7Zm0 9.75a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5Z" fill="${color}"/></svg>`;

export const getImage = ({ svg, size }) =>
  new Promise((resolve, reject) => {
    let img = new Image(size, size);
    img.onload = () => resolve(img);
    const base64 = btoa(svg);
    img.src = `data:image/svg+xml;base64,${base64}`;
  });

export const getMarkerImage = ({ size, color }) => {
  const svg = generateMarkerSvg({ size, color });
  return getImage({ svg, size });
};
