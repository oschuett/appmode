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
FROM ubuntu:24.04

# Install some Debian package
RUN apt-get update && apt-get install -y --no-install-recommends \
    git                                                          \
    less                                                         \
    nano                                                         \
    python3                                                      \
    python3-pip                                                  \
    python3-venv                                                 \
  && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment to make pip3 happy.
WORKDIR /opt/venv
RUN python3 -m venv .
ENV PATH="/opt/venv/bin:${PATH}"

# install Jupyter from git
# WORKDIR /opt/notebook/
# RUN git clone https://github.com/jupyter/notebook.git . && pip3 install .

# install Jupyter via pip
RUN pip3 install notebook==7.5.1

# install ipywidgets
RUN pip3 install ipywidgets==8.1.8

# install Appmode
COPY . /opt/appmode
WORKDIR /opt/appmode/
RUN pip3 install .                                               && \
    jupyter nbclassic-extension enable --py --sys-prefix appmode && \
    jupyter server    extension enable --py --sys-prefix appmode

# Possible Customizations
# RUN mkdir -p ~/.jupyter/custom/                                          && \
#     echo "\$('#appmode-leave').hide();" >> ~/.jupyter/custom/custom.js   && \
#     echo "\$('#appmode-busy').hide();"  >> ~/.jupyter/custom/custom.js   && \
#     echo "\$('#appmode-loader').append('<h2>Loading...</h2>');" >> ~/.jupyter/custom/custom.js

# Launch Notebook server
EXPOSE 8888
CMD ["jupyter", "nbclassic", "--ip=0.0.0.0", "--allow-root", "--no-browser", "--NotebookApp.token=''"]

#EOF
