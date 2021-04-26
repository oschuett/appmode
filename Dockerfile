#
#
#
#   This Dockerfile is mainly meant for developing and testing:
#     1. docker build --tag appmode ./
#     2. docker run --init -ti -p127.0.0.1:8888:8888 appmode
#     3. open http://localhost:8888/apps/example_app.ipynb
#
#
#
FROM ubuntu:20.04
USER root

# Install some Debian package
RUN export DEBIAN_FRONTEND="noninteractive" \
  && apt-get update && apt-get install -y --no-install-recommends \
    python3-setuptools     \
    python3-wheel          \
    python3-pip            \
    less                  \
    nano                  \
    sudo                  \
    git                   \
    npm                   \
  && rm -rf /var/lib/apt/lists/*

# install Jupyter from git
# WORKDIR /opt/notebook/
# RUN git clone https://github.com/jupyter/notebook.git . && pip3 install .

# install Jupyter via pip
RUN pip3 install notebook

# install ipywidgets
RUN pip3 install ipywidgets  && \
    jupyter nbextension enable --sys-prefix --py widgetsnbextension

# install Appmode
COPY . /opt/appmode
WORKDIR /opt/appmode/
RUN pip3 install .                                           && \
    jupyter nbextension     enable --py --sys-prefix appmode && \
    jupyter serverextension enable --py --sys-prefix appmode

# Possible Customizations
# RUN mkdir -p ~/.jupyter/custom/                                          && \
#     echo "\$('#appmode-leave').hide();" >> ~/.jupyter/custom/custom.js   && \
#     echo "\$('#appmode-busy').hide();"  >> ~/.jupyter/custom/custom.js   && \
#     echo "\$('#appmode-loader').append('<h2>Loading...</h2>');" >> ~/.jupyter/custom/custom.js

# Launch Notebook server
EXPOSE 8888
CMD ["jupyter-notebook", "--ip=0.0.0.0", "--allow-root", "--no-browser", "--NotebookApp.token=''"]

#EOF
