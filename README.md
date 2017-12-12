# SEditor
Senli的个人编辑器



this.getContent = function(){
    return this.doc.body.innerHTML;
};

//设置编辑器内容
this.setContent = function(content){
    this.doc.body.innerHTML = content; 
};
