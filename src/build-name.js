const getExtension = (pathname) => {
  const pos = pathname.indexOf('.');
  return pos > -1 ? pathname.split('.')[1] : 'html';
};

const generateFileName = (link) => {
  const { hostname, pathname } = new URL(link);
  const extension = getExtension(pathname);
  const raw = `${hostname}${pathname.replace(`.${extension}`, '')}`;
  const name = raw
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .replace(/\s/g, '-');
  return `${name}.${extension}`;
};

export default generateFileName;
