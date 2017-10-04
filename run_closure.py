from os import path, remove
from subprocess import Popen, PIPE

PATH_TO_CLOSURE = "./closure-compiler/closure-compiler-v20170910.jar"
RAM_DISK_DIR = "/tmp/rdisk/"

def write_to_ramdisk(fname, s):
    with open(RAM_DISK_DIR + fname, 'w') as f:
        f.write(s)

def rm_from_ramdisk(fname):
    if path.isfile(RAM_DISK_DIR + fname):
        remove(RAM_DISK_DIR + fname)

def run_jar(*args):
    cmd = ["java", "-jar"]
    cmd.extend(list(args))
    p = Popen(cmd , stdout=PIPE, stderr=PIPE)
    stdout, stderr = p.communicate()
    return stdout, stderr

def get_optimized_script(script):
    # Create the file for pass.
    fname = "input.js"
    write_to_ramdisk(fname, script)
    args = [PATH_TO_CLOSURE, "--js", RAM_DISK_DIR + "input.js", "--compilation_level", "ADVANCED"]
    stdout, _ = run_jar(*args)

    # Clear the file and return
    rm_from_ramdisk(fname)
    return stdout

def main():
    script = """// A simple function.
                function hello(longName) {
                    alert('Hello, ' + longName);
                }
                hello('New User');
            """
    opt_script = get_optimized_script(script);
    print opt_script    

if __name__ == "__main__":
    main()