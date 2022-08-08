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

	function getBase64Formula(sMathML, sImgFormat) {

		return new Promise(function(resolve, reject) {
			let oReq = new XMLHttpRequest();
			oReq.open("POST", 'https://www.wiris.net/demo/editor/render.' + sImgFormat, true);
			oReq.responseType = 'blob';
			oReq.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
			
			oReq.onload = function(e) {
				var reader = new FileReader();
				reader.readAsDataURL(this.response); 
				reader.onloadend = function() {
					resolve(reader.result);
				}
			}
			oReq.onerror = function(e) {
				reject(e);
			}
			oReq.send(jQuery.param({
				mml: sMathML,
				autozoom: true,
				centerbaseline: false
			}));
		});
	}

	function add_to_document(sMethod, oParams) {
		window.Asc.plugin.executeMethod("GetVersion", [], function(version) {
			var nMajorV = Number(version.split('.')[0]);
			var nMinorV = Number(version.split('.')[1]);
			if (sMethod === "AddOleObject") {
				if ((version === "develop" || (nMajorV >= 7 && nMinorV >= 2)) && window.Asc.plugin.info.editorType === "word") {
					oParams.height = oParams.height * 36000.0; // convert to EMU
					oParams.width  = oParams.width * 36000.0; // convert to EMU

					window.Asc.scope.params = oParams;
					window.Asc.plugin.callCommand(function() {
						var oDocument = Api.GetDocument();
						if (!Api.CreateOleObject)
							return false;
							
						var oOleObject = Api.CreateOleObject(Asc.scope.params.imgSrc, Asc.scope.params.width, Asc.scope.params.height, Asc.scope.params.data, Asc.scope.params.guid);
						var oPara = Api.CreateParagraph();
						var oRun = Api.CreateRun();
						oRun.SetPosition(Asc.scope.params.position);
						
						oRun.AddDrawing(oOleObject);
						oPara.Push(oRun);
						
						oDocument.InsertContent([oPara], true);
					});
				}
				else {
					window.Asc.plugin.executeMethod(sMethod, [oParams]);
				}
			}
			// EditOleObject
			else {
				window.Asc.plugin.executeMethod(sMethod, [oParams], function() {
					window.Asc.plugin.executeCommand("close", "");
				});
			}
		});
	}
	
	function paste_formula(){
		var sMathML = editor.getMathML();
		let sBase64png = await getBase64Formula(sMathML, "png");
		let sBase64svg = await getBase64Formula(sMathML, "svg");
		
		var oImg = new Image(); 
		oImg.onload = function() {
			var oInfo = window.Asc.plugin.info;

			var sMethod = (oInfo.objectId === undefined) ? "AddOleObject" : "EditOleObject";

			var nFormulaSourceHeight = editor.editorModel.formulaModel.getHeight();
			var nFormulaSourceWidth = editor.editorModel.formulaModel.getWidth();
			var nBaseLineFromTop = editor.editorModel.getFormulaBaseline();

			var nPositionMM = -((nFormulaSourceHeight - nBaseLineFromTop) / (oInfo.mmToPx))
			var nPosition =  2 * (nPositionMM / (25.4 / 72.0)) + (nPositionMM / (25.4 / 72.0)); // convert to hps

			var oParams = {
				guid:      oInfo.guid,
				position:  nPosition, 
				width:     nFormulaSourceWidth / oInfo.mmToPx,
				height:    nFormulaSourceHeight / oInfo.mmToPx,
				imgSrc:    sBase64png,
				data:      {
					data1: sMathML,
					data2: sBase64svg
				},
				objectId:  oInfo.objectId,
				resize:    oInfo.resize
			};

			add_to_document(sMethod, oParams);
		};
		
		oImg.src = sBase64png;
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
