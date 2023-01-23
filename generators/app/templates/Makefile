<% if(hana){ -%>
build-db:
<% if(buildCmd === 'pack'){ -%>
	pack build <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-db<% }else{ -%><%= dockerID %>/<%= projectName %>-db:latest<% } -%> -p db -B paketobuildpacks/builder:base
<% }else{ -%>
	<%= buildCmd %> build --platform amd64 -t <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-db<% }else{ -%><%= dockerID %>/<%= projectName %>-db:latest<% } -%> -f db/Dockerfile .
<% } -%>
<% } -%>
build-srv:
<% if(buildCmd === 'pack'){ -%>
	pack build <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-srv<% }else{ -%><%= dockerID %>/<%= projectName %>-srv:latest<% } -%> -p srv -B paketobuildpacks/builder:base
<% }else{ -%>
	<%= buildCmd %> build --platform amd64 -t <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-srv<% }else{ -%><%= dockerID %>/<%= projectName %>-srv:latest<% } -%> -f srv/Dockerfile .
<% } -%>
<% if(sqlite){ -%>
build-sqlite:
<% if(buildCmd === 'pack'){ -%>
	pack build <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-sqlite<% }else{ -%><%= dockerID %>/<%= projectName %>-sqlite:latest<% } -%> -p sqlite -B paketobuildpacks/builder:base
<% }else{ -%>
	<%= buildCmd %> build --platform amd64 -t <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-sqlite<% }else{ -%><%= dockerID %>/<%= projectName %>-sqlite:latest<% } -%> -f sqlite/Dockerfile .
<% } -%>
<% } -%>
build-app:
<% if(buildCmd === 'pack'){ -%>
	pack build <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-app<% }else{ -%><%= dockerID %>/<%= projectName %>-app:latest<% } -%> -p app -B paketobuildpacks/builder:base
<% }else{ -%>
	<%= buildCmd %> build --platform amd64 -t <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-app<% }else{ -%><%= dockerID %>/<%= projectName %>-app:latest<% } -%> -f app/Dockerfile .
<% } -%>

docker-push:<% if(hana){ -%> build-db<% } -%> build-srv<% if(sqlite){ -%> build-sqlite<% } -%> build-app
<% if(hana){ -%>
	<% if(buildCmd === 'podman'){ -%>podman<% }else{ -%>docker<% } -%> push <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-db<% }else{ -%><%= dockerID %>/<%= projectName %>-db:latest<% } -%>

<% } -%>
	<% if(buildCmd === 'podman'){ -%>podman<% }else{ -%>docker<% } -%> push <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-srv<% }else{ -%><%= dockerID %>/<%= projectName %>-srv:latest<% } -%>

<% if(sqlite){ -%>
	<% if(buildCmd === 'podman'){ -%>podman<% }else{ -%>docker<% } -%> push <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-sqlite<% }else{ -%><%= dockerID %>/<%= projectName %>-sqlite:latest<% } -%>

<% } -%>
	<% if(buildCmd === 'podman'){ -%>podman<% }else{ -%>docker<% } -%> push <% if(dockerRepositoryName !== ''){ -%><%= dockerID %>/<%= dockerRepositoryName %>:<%= projectName %>-app<% }else{ -%><%= dockerID %>/<%= projectName %>-app:latest<% } -%>


helm-deploy:
<% if(hana){ -%>
	helm upgrade -n <%= namespace %> -i <%= projectName %>-db helm/<%= projectName %>-db --install<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>

<% } -%>
	helm upgrade -n <%= namespace %> -i <%= projectName %>-srv helm/<%= projectName %>-srv --install<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>

<% if(sqlite){ -%>
	helm upgrade -n <%= namespace %> -i <%= projectName %>-sqlite helm/<%= projectName %>-sqlite --install<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>

<% } -%>
	helm upgrade -n <%= namespace %> -i <%= projectName %>-app helm/<%= projectName %>-app --install<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>


helm-undeploy:
	helm uninstall -n <%= namespace %> <%= projectName %>-app<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>

<% if(sqlite){ -%>
	helm uninstall -n <%= namespace %> <%= projectName %>-sqlite<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>

<% } -%>
	helm uninstall -n <%= namespace %> <%= projectName %>-srv<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>

<% if(hana){ -%>
	helm uninstall -n <%= namespace %> <%= projectName %>-db<% if(kubeconfig !== ""){ -%> --kubeconfig <%= kubeconfig %><% } -%>

<% } -%>
