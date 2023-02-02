export const dataURItoBlob = dataURI => fetch(dataURI).then(res => res.blob());

export const readAsDataURL = data =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(data);
  });

export const openFile = file => readAsDataURL(file);
