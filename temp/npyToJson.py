import numpy as np
import os
import json

npyFile = np.load('src/app/room-seg-data/mock-lineset.npy')

with open(os.path.join('src/app/assets/', 'mock-lineset.json'), 'w') as jsonFile:
    json.dump(np.ndarray.tolist(npyFile), jsonFile)