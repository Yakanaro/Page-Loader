install: 
	npm ci
make lint:
	npx eslint 
publish:
	npm publish --dry-run
page-loader:
	node page-loader.js
test:
	NODE_OPTIONS=--experimental-vm-modules npx jest
test-coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --bail --coverage --coverageProvider=v8