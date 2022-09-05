<% if(hana){ -%>
build-db:
<% if(buildCmd === 'pack'){ -%>
	pack build <%= dockerID %>/<%= projectName %>-db:latest -p db -B paketobuildpacks/builder:base
<% }else{ -%>
	<%= buildCmd %> build --platform amd64 -t <%= dockerID %>/<%= projectName %>-db:latest -f db/Dockerfile .
<% } -%>
<% } -%>
build-srv:
<% if(buildCmd === 'pack'){ -%>
	pack build <%= dockerID %>/<%= projectName %>-srv:latest -p srv -B paketobuildpacks/builder:base
<% }else{ -%>
	<%= buildCmd %> build --platform amd64 -t <%= dockerID %>/<%= projectName %>-srv:latest -f srv/Dockerfile .
<% } -%>
build-app:
<% if(buildCmd === 'pack'){ -%>
	pack build <%= dockerID %>/<%= projectName %>-app:latest -p app -B paketobuildpacks/builder:base
<% }else{ -%>
	<%= buildCmd %> build --platform amd64 -t <%= dockerID %>/<%= projectName %>-app:latest -f app/Dockerfile .
<% } -%>

docker-push:<% if(hana){ -%> build-db<% } -%> build-srv build-app
<% if(hana){ -%>
	<% if(buildCmd === 'podman'){ -%>podman<% }else{ -%>docker<% } -%> push <%= dockerID %>/<%= projectName %>-db:latest
<% } -%>
	<% if(buildCmd === 'podman'){ -%>podman<% }else{ -%>docker<% } -%> push <%= dockerID %>/<%= projectName %>-srv:latest
	<% if(buildCmd === 'podman'){ -%>podman<% }else{ -%>docker<% } -%> push <%= dockerID %>/<%= projectName %>-app:latest

helm-deploy:
<% if(hana){ -%>
	helm upgrade -n <%= namespace %> -i <%= projectName %>-db helm/<%= projectName %>-db --install
<% } -%>
	helm upgrade -n <%= namespace %> -i <%= projectName %>-srv helm/<%= projectName %>-srv --install
	helm upgrade -n <%= namespace %> -i <%= projectName %>-app helm/<%= projectName %>-app --install

helm-undeploy:
	helm uninstall -n <%= namespace %> <%= projectName %>-app
	helm uninstall -n <%= namespace %> <%= projectName %>-srv
<% if(hana){ -%>
	helm uninstall -n <%= namespace %> <%= projectName %>-db
<% } -%>