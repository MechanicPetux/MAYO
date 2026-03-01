"use strict";
// i hate js so fucking much

(() => {

// Utils

print = console.log;

// Returns file's extension including dot, in lowercase.
// If name has no extension (i.e dot), returns whole name
function GetExt(Name) {
	return Name.substring(Name.lastIndexOf('.')).toLowerCase();
}

// Download file in given format.
function Download(Base64, Name, Format) {
	const E = document.createElement('a');
	E.href = "data:" + Format + Base64;
	E.download = Name;
	E.click();
}

const WarnsEl = document.getElementById("Warns");
const ErrorsEl = document.getElementById("Errors");
var Warns = new Set();
var Errors = new Set();
function AddWarning(Warning) {
	if (!Warns.has(Warning))
		WarnsEl.textContent += Warning + '\n';
	Warns.add(Warning);
}
function AddError(Error) {
	if (!Errors.has(Error))
		ErrorsEl.textContent += Error + '\n';
	Errors.add(Error);
}
function ClearWarnings() {
	Warns.clear();
	WarnsEl.textContent = "";
}
function ClearErrors() {
	Errors.clear();
	ErrorsEl.textContent = "";
}















// File processing

const Supported = {
	".json": JSONMinify,
	".css": E => csso.minify(E).css,
	".js": E => Terser.minify(E).then(S => S.code),
	".html": E => HTMLMinifier.minify(E, {minifyCSS:true, minifyJS:true, minifyURLs:true, collapseWhitespace:true}).then(S => S)
}

const ZIP = [
	".zip",
	".jar" // Jar is also zip if you didn't know.
]

async function DoFile(Text, FileName, Minifier) {
	document.getElementById("WorkingOn").textContent = "Woking on: " + FileName;
	try {
		return await Minifier(Text);
	}
	catch (e) {
		print("this error");
		AddError(FileName + ": " + e);
		return Text;
	}
}

async function DoZip(File) {
	var Zip = await JSZip.loadAsync(File);

	for (const Path in Zip.files) {
		var zipEntry = Zip.files[Path];
		if (zipEntry.dir) continue;

		const Minifier = Supported[GetExt(zipEntry.name)];
		if (Minifier) // Do we have minifier for this file type?
			await zipEntry.async("text").then(Text => Zip.file(zipEntry.name, DoFile(Text, zipEntry.name, Minifier)));
		else
			AddWarning("Unsupported file types skipped");
	}

	Zip.generateAsync({type:"base64", compression:"DEFLATE"}).then(Base64 => Download(Base64, File.name, "application/zip;base64,"));
	print("End");
}

function DoFiles(List) {
	ClearWarnings();
	ClearErrors();
	for (const File of List) {
		const Extension = GetExt(File.name);
		const Minifier = Supported[Extension];
		if (ZIP.includes(Extension)) // Is file a zip archive?
			DoZip(File).catch(e => AddError(File.name + ": " + e));
		else if (Minifier) // Do we have minifier for this file type?
			File.text().then(async Text => Download(encodeURIComponent(await DoFile(Text, File.name, Minifier)), File.name, "text/plain;charset=utf-8,"));
		else
			AddWarning("Unsupported file types skipped");
	}
}












// Setting events

document.getElementById("Input").oninput = function() {
	DoFiles(this.files);
};

const DropOverlay = document.getElementById("DropOverlay");
var Enters = 0;
document.ondragenter = function(e) {
	Enters++;
	print(Enters)
	DropOverlay.classList.add("Active");
	e.preventDefault();
}
document.ondragleave = function(e) {
	Enters--;
	print(Enters)
	if (Enters === 0)
		DropOverlay.classList.remove("Active");
}
document.ondragover = function(e) {
	e.preventDefault();
}
document.ondrop = function(e) {
	e.preventDefault();
	DropOverlay.classList.remove("Active");
	Enters = 0;
	print(e);
	DoFiles(e.dataTransfer.files);
}

})()