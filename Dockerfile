#
#
#
#   This Dockerfile is mainly meant for developing and testing:
#     1. docker build --tag appmode ./
#     2. docker run --init -ti -p8888:8888 appmode
#     3. open http://localhost:8888/apps/example_app.ipynb
#
#
#
FROM ubuntu:rolling
USER root

# Install some Debian package
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-setuptools     \
    python3-wheel          \
    python3-pip            \
    less                  \
    nano                  \
    sudo                  \
  && rm -rf /var/lib/apt/lists/*

# install Jupyter
RUN pip3 install notebook ipywidgets  && \
    jupyter nbextension enable --sys-prefix --py widgetsnbextension

# install Appmode
COPY . /opt/appmode
WORKDIR /opt/appmode/
RUN pip3 install .                                            && \
    jupyter nbextension     enable --py --sys-prefix appmode && \
    jupyter serverextension enable --py --sys-prefix appmode

# Uncomment following RUN line to hide the "Edit App" button.
# Beware that this does not prevent users from changing the URL manually.
# RUN mkdir -p ~/.jupyter/custom/ && echo "\$('#appmode-leave').hide();" >> ~/.jupyter/custom/custom.js

# Launch Notebook server
EXPOSE 8888
CMD ["jupyter-notebook", "--ip=0.0.0.0", "--allow-root", "--no-browser", "--NotebookApp.token=''"]

#EOF