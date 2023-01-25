```
kubectl config set-context --current --namespace=dev
kubectl get pods 
```
Run this to create the Persistent Volume Claim BEFORE doing a helm-deploy
```
kubectl apply -f sqlite/kubectl/pvc.yaml
```
Shell into the running sqlite pod
```
export PNAME="<%= projectName %>-sqlite" ; export POD=$(kubectl get pods | grep $PNAME | cut -d ' ' -f 1) ; echo 'Bash Prompt in '$POD ; kubectl exec pod/$POD --container $PNAME -n dev -it -- bash
```
Watch the logs of the various pods
```
export POD=$(kubectl get pods | grep <%= projectName %>-srv | cut -d ' ' -f 1) ; echo $POD ; kubectl logs $POD --tail 100 --follow

export POD=$(kubectl get pods | grep <%= projectName %>-sqlite | cut -d ' ' -f 1) ; echo $POD ; kubectl logs $POD --tail 100 --follow

export POD=$(kubectl get pods | grep <%= projectName %>-app | cut -d ' ' -f 1) ; echo $POD ; kubectl logs $POD --tail 100 --follow
```
