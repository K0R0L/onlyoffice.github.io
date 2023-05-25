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

	var genericIntegrationInstance;
	var mathML;
	var oEditor;

	window.Asc.plugin.init = function(sMathML)
	{
		mathML = sMathML;

		let onLoadFunc = function() {
			if (mathML)
				genericIntegrationInstance.core.contentManager.setMathML(mathML);

			oEditor = genericIntegrationInstance.core.contentManager.editor;
		}

		var genericIntegrationProperties = {};
		genericIntegrationProperties.target = document.getElementById('htmlEditor');
		genericIntegrationProperties.toolbar = document.getElementById('toolbar');
		
		genericIntegrationInstance = new WirisPlugin.GenericIntegration(genericIntegrationProperties);

		// setting language
		if (langs_map[window.Asc.plugin.info.lang] != undefined) {
			genericIntegrationInstance.editorParameters = { language: langs_map[window.Asc.plugin.info.lang] };
		}
		
		genericIntegrationInstance.init();
		genericIntegrationInstance.listeners.fire('onTargetReady', {});
		
		WirisPlugin.currentInstance = this.wiris_generic;

		if (window.location.href.search("type=chemistry") !== -1) {
			const A = genericIntegrationInstance.getCore().getCustomEditors();
			A.enable("chemistry"),
			genericIntegrationInstance.openNewFormulaEditor()
		}
		else {
			genericIntegrationInstance.core.getCustomEditors().disable();
			genericIntegrationInstance.openNewFormulaEditor();
		}

		genericIntegrationInstance.core.contentManager.listeners.add({eventName: "onLoad", callback: onLoadFunc});
		WirisPlugin.Configuration.properties.saveMode = "base64";

		window.Asc.plugin.resizeWindow(600, 310, 600, 395, 0, 0);
		$('.asc-window.advanced-settings-dlg.notransform').onRe
	};

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
	
	async function paste_formula() {
		function createHTMLElementFromString(htmlString) {
			var div = document.createElement('div');
			div.innerHTML = htmlString.trim();
			return div.firstChild;
		}
		
		var sMathML = oEditor.getMathML();
		var oImg = createHTMLElementFromString(WirisPlugin.Parser.initParse(sMathML)); 

		oImg.onload = function() {
			var oInfo = window.Asc.plugin.info;

			var sMethod = (oInfo.objectId === undefined) ? "AddOleObject" : "EditOleObject";

			var nFormulaSourceHeight = oEditor.editorModel.formulaModel.getHeight();
			var nFormulaSourceWidth = oEditor.editorModel.formulaModel.getWidth();
			var nBaseLineFromTop = oEditor.editorModel.getFormulaBaseline();

			var nPositionMM = -((nFormulaSourceHeight - nBaseLineFromTop) / (oInfo.mmToPx))
			var nPosition =  2 * (nPositionMM / (25.4 / 72.0)) + (nPositionMM / (25.4 / 72.0)); // convert to hps

			this.width *= 5;
			this.height *= 5;

			let canvas = document.createElement("canvas");
			canvas.width = this.width;
			canvas.height = this.height;

			let oCtx = canvas.getContext('2d');
			oCtx.drawImage(this, 0, 0, canvas.width, canvas.height);
			let base64png = canvas.toDataURL();

			var oParams = {
				guid:      oInfo.guid,
				position:  nPosition, 
				width:     nFormulaSourceWidth / oInfo.mmToPx,
				height:    nFormulaSourceHeight / oInfo.mmToPx,
				imgSrc:    base64png,
				data:      sMathML,
				objectId:  oInfo.objectId,
				resize:    oInfo.resize
			};

			add_to_document(sMethod, oParams);
		};
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
