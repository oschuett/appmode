import os

try:
    from setuptools import setup, find_packages
except ImportError:
    from distutils.core import setup

modulename = 'jupyter_appmode'
the_license = "The MIT license"

# Get the version number in a dirty way
folder = os.path.split(os.path.abspath(__file__))[0]
fname = os.path.join(folder, modulename, '__init__.py')
with open(fname) as init:
    ns = {}
    # Get lines that match, remove comment part 
    # (assuming it's not in the string...)
    versionlines = [l.partition('#')[0] 
                    for l in init.readlines() if l.startswith('__version__')]
if len(versionlines) != 1:
    raise ValueError("Unable to detect the version lines")
versionline = versionlines[0]
version = versionline.partition('=')[2].replace('"', '').replace("'", '').strip()

description_short = "A Jupyter extension to hide the controls, disable editing, and work in a 'App mode'"
with open(os.path.join(folder, 'README.md')) as f:
    description_long = f.read()

setup(
    name=modulename,
    description=description_short,
    url='http://github.com/oschuett/jupyter_appmode',
    license=the_license,
    author = 'Ole Schuett',
    version=version,
    install_requires=[
        'jupyter'
    ],
    packages=find_packages(),
    # Needed to include some static files declared in MANIFEST.in
    include_package_data = True,
    keywords = ['jupyter extension', 'app mode'],
    long_description=description_long,
    classifiers=[
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
