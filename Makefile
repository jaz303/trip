JS = index.js demo/demo.js 

demo/demo.bundle.js: $(JS)
	browserify demo/demo.js > demo/demo.bundle.js

clean:
	rm -f demo/demo.bundle.js
