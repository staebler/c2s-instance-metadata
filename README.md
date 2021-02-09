### Overview

This c2s-instance-metadata project is useful for installing OpenShift into a simulated AWS C2S region.

The simulator intercepts calls made to the AWS API to behave as though the
calls are being made in a C2S region. However, the simulator cannot intercept
calls made to the instance metadata API since those calls are local to each instance.

The c2s-instance-metadata intercept runs locally on each OpenShift node to intercept calls made to the
instance metadata API and replace the actual region in the responses with the simulated C2S region.
For example, if the instance is really running in the us-east-1 region, then the c2s-instance-metadata
interceptor replaces all occurrences of us-east-1 with us-iso-east-1 so that callers think that the
instance is actually in the us-iso-east-1 region.

There are two parts of the interceptor.
1. There is a node.js server running in a container that forwards requests that it receives to the
real instance metadata server. The node.js server replaces the region in the response received from the
metadata server and returns the mangled response to the caller.
2. There is an iptables rule that redirects calls to the instance metadata server to the node.js server.
The node.js server runs using its own user, name "metadata", so that requests that the node.js server make
are ignored by the rule and are routed to the real metadata server.

The interceptor needs to run on every node in the OpenShift cluster. This is handled by using two
[MachineConfigs](config/c2s-instance-metadata-machineconfig.yaml), one for the masters and one for the
workers. The two MachineConfigs are identical save for their names and the roles to which they apply.

### Usage
1. Add the c2s-instance-metadata image to a registry usable by your cluster. You can either build the image
yourself or use quay.io/staebler/c2s-instance-metadata:latest.
1. Create the manifests for your cluster via `openshift-install create manifests --dir=${install-dir}`.
1. Add the MachineConfig manifests.
    1. Add two copies of the [MachineConfig](config/c2s-instance-metadata-machineconfig.yaml) to "${install-dir}/manifests".
    1. Set the `.metadata.labels[machineconfiguration.openshift.io/role]` field in each copy, with one set to "master" and
the other set to "worker".
    1. Set the `.metadata.name` field in each copy so that the names are different.
    1. Replace {{C2S-INSTANCE-METADATA-IMAGE}} with the c2s-instance-metadata image in your registry.
1. Add a non-empty but unused cloud config to the cloud-provider-config manifest. This is needed for the time being
because there is an issue with the kube-apiserver where it is expecting a cloud config to exist.
    1. Add the following snippet to the `.data` field of "${install-dir}/manifests/cloud-provider-config.yaml".
        ```
           config: |
             [Global]
        ```
1. Create the cluster via `openshift-install create cluster --dir=${install-dir}`.