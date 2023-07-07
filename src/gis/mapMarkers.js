const generateMarkerSvg = ({ color, size }) =>
  `<svg height="${size}px" width="${size}px" viewBox="-4 0 36 36" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M14 0c7.732 0 14 5.641 14 12.6C28 23.963 14 36 14 36S0 24.064 0 12.6C0 5.641 6.268 0 14 0Z" fill="${color}"/><circle fill="#fff" fill-rule="nonzero" cx="14" cy="14" r="7"/></g></svg>`;

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
