//兼容require模式
//webkit 内核的 IM编辑器, 不用考虑兼容性

var strUndef = String(undefined);

var SEditor = function(win){
    var $ = win.$;
    var doc = win.document;
    var bW3CRangeSupport = !!document.createRange;

    $.fn.SEditor = function(options){
        options = options || {};
        if(typeof options !== 'object'){
            throw new Error('arguments is error type!');
        }
        var self = this;
        var firstTextarea = self[0]; //默认只有一个编辑器
        var toolbarTemplate = [
            ''
        ];
        var defalutOptions = {
            id: 'ifr',
            pluginId: null,
            tools: ["fontname", "fontsize", 'Bold', 'Italic', 'Underline'],
            operateBarClassName: 'operate_bar',
            domain: '',
            loadAfter: function(){}
        };
        options = _.extend(defalutOptions, options);
        //初始化编辑器
        this.initialize = function(){
            this.id = options.id;
            this.pluginid = options.pluginid;
            this.render();
        };

        //渲染编辑器容器面板
        this.render = function(){
            this.renderPanel();
            this.renderToolbar();
            this.renderIframe();
        };

        //渲染一个覆盖文本区域的div, 隐藏文本区域
        this.renderPanel = function(){
           this.position = this.getPosition();
           this.zIndex = firstTextarea.style.zIndex || 0;
           //设置一个绝对定位的元素，覆盖到文件区域里面去
           this.$editor = $('<div class="editor_panel"><ul class="operate_bar"></ul><div class="frame_panel"></div></div>');
           var cssOption = _.extend(this.position, {
                position: 'absolute',
                zIndex: this.zIndex + 1,
                border: '1px solid #ccc'
           });
           this.$editor.css(cssOption);
           $(doc.body).append(this.$editor);
           self.css({
                'visibility': 'hidden'
           });
        };
        //tools hash
        this.toolsContent = {
            'fontname': ['宋体', '黑体', '楷体, 楷体_GB2312', '幼圆', 'Arial', 'Arial Black', 'Verdana', 'Times New Roman'],
            'fontsize': [
                    {name: '极小', size: '9px', font: 1},
                    {name: '较小', size: '12px', font: 2},
                    {name: '小', size: '16px', font: 3},
                    {name: '中', size: '18px', font: 4},
                    {name: '大', size: '24px', font: 5},
                    {name: '较大', size: '32px', font: 6},
                    {name: '极大', size: '48px', font: 7}
            ]
        };

        this.renderToolbar = function(){
            this.$operateUL = this.$editor.find('.operate_bar');
            var htmls = [];
            var contentKeys = _.keys(this.toolsContent);
            _.each(options.tools, function(toolname, index){
                var className = options.operateBarClassName + '_' + toolname;
                var hasContent = false;
                if(_.include(contentKeys, toolname)){
                    hasContent = true;
                }
                var html = '<li class="' + className + '" data-index="' + index + '" data-name="' + toolname +'" data-content="' + hasContent + '"></li>';
                htmls.push(html);
            });
            this.$operateUL.html(htmls.join(''));
            this.$operateUL.on('click', 'li', _.bind(this.initToolbarEvent, this));
            this.$editor.on('click', '.editor_tool', _.bind(this.initToolListEvent, this));
            this.$editor.on('mouseenter', '.editor_tool', function(e){
                this.style.backgroundColor = 'silver';
            });
            this.$editor.on('mouseleave', '.editor_tool', function(e){
                this.style.backgroundColor = 'white';
            });
        };
        //渲染编辑器
        this.renderIframe = function(){
            this.pHeight = this.position.height;
            this.ulHeight = this.$operateUL.height();
            var offset = 3; //修正高度
            this.iframeHeight = this.pHeight - this.ulHeight - offset;
            var id = options.id;
            var setDomain			= options.domain ? 'document.domain=\'' + options.domain + '\';' : '';
            var	iframeStyle		    = 'height: 100%;width:100%;border:0px;margin:0px;padding:0px;background-color:#FFFFFF';
            var	iframeHTMLStyle 	= 'body{background-color:#fff;font-size:13px;font-family:Helvetica Neue;padding:3px auto auto 5px;height:95%;line-height:2;cursor:text;}table{margin:0px;}table td{vertical-align:top;font-size:13px;}pre {white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;}p{margin:0px;}';
            var iframeSrc			= 'javascript:document.open();'+ setDomain + 'document.write(\'<html><head><style>' + iframeHTMLStyle +'<\/style><\/head><body><\/body><\/html>\');document.close();';
            var editorIframe        = '<iframe id="' + id + '" style="'+ iframeStyle +'" frameborder=0 src="' + iframeSrc + '" name="' + id + '"></iframe>';
            this.$framePanel = this.$editor.find('.frame_panel');
            this.$framePanel.append(editorIframe);
            this.$framePanel.css({
                position: 'absolute',
                top: this.ulHeight + 1,
                height: this.iframeHeight,
                width: '100%'
            });
            this.$frame = this.$framePanel.children().first();
            this.iframe = this.$frame[0];
            this.win = this.iframe.contentWindow;
            this.doc = this.win.document;
            //this.$frame.load(_.bind(this.ifronload, this));
            setTimeout(_.bind(this.ifronload, this), 200);
            this.doc.body.onclick = _.bind(function(){
                this.hideLayer();
            }, this);
        };

        //iframe加载事件
        this.ifronload = function(){
            this.doc.designMode = 'on';
            this.doc.body.contentEditable = 'true';
            this.doc.execCommand('useCSS', false, false);
            options.loadAfter();
        };

        /*
         * @ 获取Textarea的绝对位置信息
         */
        this.getPosition = function(){
            var clientRect = firstTextarea.getBoundingClientRect();
            return clientRect;
        };

        //execCommand
        this.format = function(type, param){
            this.focus();
            if(!param){
                this.doc.execCommand(type, false, false);
            }else{
                this.doc.execCommand(type, false, param);
            }
        };

        //初始化工具栏点击事件
        this.initToolbarEvent = function(e){
            var el = e.currentTarget;
            var $el = $(el);
            var name = $el.data('name'),
            hasContent = $el.data('content'),
            index = $el.data('index');
            this.hideLayer();
            if(hasContent){
                var content = this.toolsContent[name];
                var htmlArr = [];
                htmlArr = this.createToolListTemplate(content, name);
                this.showLayer(index);
                this.$layer.html(htmlArr.join(''));
            }else{
                this.format(name);
            }
        };

        //初始化工具栏单功能列表的点击事件
        this.initToolListEvent = function(e){
             var el = e.currentTarget;
             var $el = $(el);
             var name = $el.data('name'),
                 value = $el.data('value');
             this.format(name, value);
             this.hideLayer();
        };

        //工具栏单功能列表的模板渲染
        this.createToolListTemplate = function(content, name){
            var htmlArr = [];
            _.each(content, function(item, index){
                var style = ['style=', '"'],
                value = item;
                text = item;
                switch(name){
                    case 'fontname':
                        style.push('font-family:');
                    break;
                    case 'fontsize':
                        value = item.font;
                        text = item.size;
                        style.push('font-size:');
                    break;
                }
                style.push(text);
                style.push('"');
                var html = '<li class="editor_tool" data-name="' + name + '" data-value="' + value + '" ' + style.join('') + '>' + text + '</li>';
                htmlArr.push(html);
            });
            return htmlArr;
        };
        
        this.hideLayer = function(){
            this.$layer = $('#toolbar_layer');
            if(this.$layer.length){
                this.$layer.remove();
            }
        };

        this.showLayer = function(index){
            this.$layer = $('#toolbar_layer');
            if(this.$layer.length === 0){
                this.$layer = $('<div id="toolbar_layer"></div>');
                this.$layer.css({
                    backgroundColor: 'white',
                    position: 'absolute',
                    zIndex: this.zIndex + 2,
                    left: index * 40 + 'px',
                    top: this.ulHeight + 1,
                    width: '160px',
                    border: '1px solid silver'
                });
            }
            this.$editor.append(this.$layer);
        };

        //获取内容
        this.getContent = function(){
            return this.doc.body.innerHTML;
        };

        //设置编辑器内容
        this.setContent = function(content){
            this.doc.body.innerHTML = content; 
        };

        //自动聚焦
        this.focus = function(){
            setTimeout(function(){
                self.win.focus();
            },10);
        };
        //自动离焦
        this.blur = function(){
            $(this.doc).blur();
        };
        //初始化编辑器
        this.initialize();
        return this;
    };
};

if(typeof module !== strUndef && typeof module.exports === 'object'){
    module.exports = SEditor;
}else{
    SEditor(this);
}
