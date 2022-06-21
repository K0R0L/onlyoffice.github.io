(function(window, undefined){
	var langs_map = {
		"ca-CA": "ca",
		"zh-ZH": "zh",
		"cs-CS": "cs",
		"da-DA": "da",
		"nl-NL": "nl",
		"en-EN": "en",
		"fi-FI": "fi",
		"fr-FR": "fr",
		"de-DE": "de",
		"el-EL": "el",
		"hu-HU": "hu",
		"id-ID": "id",
		"it-IT": "it",
		"ja-JA": "ja",
		"ko-KO": "ko",
		"nb-NB": "nb",
		"pl-PL": "pl",
		"pt-PT": "pt",
		"pt-BR": "pt_br",
		"ro-RO": "ro",
		"ru-RU": "ru",
		"es-ES": "es",
		"sv-SV": "sv",
		"tr-TR": "tr"
	}

	var isLoaded = false;
	var plugin_lang = "en";

	window.Asc.plugin.init = function(sMathML)
	{
		if (langs_map[window.Asc.plugin.info.lang] != undefined)
			plugin_lang = langs_map[window.Asc.plugin.info.lang];

		if (!isLoaded) {
			
			editor = com.wiris.jsEditor.JsEditor.newInstance({'language': plugin_lang});
        	editor.insertInto(document.getElementById('editorContainer'));

			if (window.location.href.search("type=chemistry") !== -1) {
				editor.setParams({
					toolbar: "chemistry"
				});
			}
		}

		window.Asc.plugin.resizeWindow(600, 310, 600, 395, 0, 0);
		if (sMathML !== "")
			editor.setMathML(sMathML);
	};

	function render_formula(sMathML, sImgFormat){
		var oReq = new XMLHttpRequest();
		oReq.open("POST", 'https://www.wiris.net/demo/editor/render.' + sImgFormat, true);
		oReq.responseType = 'blob';
		oReq.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
		
		oReq.onload = function(e) {
			var reader = new FileReader();
			reader.readAsDataURL(this.response); 
			reader.onloadend = function() {
				var base64data = reader.result;
				var oImg = new Image(); 
				oImg.onload = function() {
					var oInfo = window.Asc.plugin.info;

					var sMethod = (oInfo.objectId === undefined) ? "AddOleObject" : "EditOleObject";
					var nFormulaSourceHeight = editor.editorModel.formulaModel.getHeight();
					var nBaseLineFromTop = editor.editorModel.getFormulaBaseline();
					var nRelBaseLine = 1 - nBaseLineFromTop / nFormulaSourceHeight;

					var oParams = {
						guid:      oInfo.guid,
						position:  -((oImg.height * nRelBaseLine) / (oInfo.mmToPx * 6)),
						widthPix:  (oInfo.mmToPx * oImg.width) >> 0,
						heightPix: (oInfo.mmToPx * oImg.height) >> 0,
						width:     (oImg.width / oInfo.mmToPx) / 6,
						height:    (oImg.height / oInfo.mmToPx) / 6,
						imgSrc:    base64data,
						data:      sMathML,
						objectId:  oInfo.objectId,
						resize:    oInfo.resize
					};

					add_in_document(sMethod, oParams);
				};
				
				oImg.src = base64data;
			}
		}
		oReq.send(jQuery.param({
			mml: sMathML,
			autozoom: true,
			centerbaseline: false
		}));
	}

	function add_in_document(sMethod, oParams){
		window.Asc.plugin.executeMethod(sMethod, [oParams]);
	}
	function paste_formula(sImgFormat){
		if (!sImgFormat)
			sImgFormat = "png";
		var sMathML = editor.getMathML();
		render_formula(sMathML, sImgFormat);
	}

	window.Asc.plugin.button = function(id)
	{
		if (id === 0)
			paste_formula();
		else
			this.executeCommand("close", "");
	};

	window.Asc.plugin.onExternalMouseUp = function()
	{
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("mouseup", true, true, window, 1, 0, 0, 0, 0,
			false, false, false, false, 0, null);

		document.dispatchEvent(evt);
	};

})(window, undefined);
