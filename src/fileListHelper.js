function addFileList(input, fileArray) {

    var file_list = fileArray;
    file_list.__proto__ = Object.create(FileList.prototype)
  
    Object.defineProperty(input, 'files', {
      value: file_list,
      writable: false,
      configurable: true
    })
    return input
  }
  export default addFileList;