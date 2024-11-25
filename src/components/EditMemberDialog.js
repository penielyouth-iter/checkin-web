import React, { useState } from 'react';
import Select from 'react-select'; // Using react-select for dropdown functionality

const EditMemberDialog = (props) => {
  const [inputName, setInputName] = useState('');
  const [selectedGender, setSelectedGender] = useState('弟兄');
  const okButtonDisabled = inputName.trim().length === 0;

  const memberNames = [];
  if (props.familyData != null) {
    for (const member of props.familyData.members) {
      memberNames.push(member.name);
    }
  }

  // Handle dialog close (cancel)
  const handleCancel = () => {
    setInputName('');
    props.onCancel();
  };

  // Handle confirmation (add or delete)
  const handleConfirm = () => {
    props.onConfirm(
      inputName.trim(),
      props.familyData.title,
      selectedGender === '弟兄' ? 'M' : 'F',
      props.dialogType
    );
    setInputName('');
    setSelectedGender('弟兄');
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: props.visible ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          margin: '0 50px',
          padding: '20px',
          borderRadius: '10px',
          width: '400px',
        }}
      >
        {props.dialogType === 'Add' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0' }}>
              Hello friend! 🥳
            </h2>
            <div style={{ flexDirection: 'row', marginTop: '10px' }}>
              <input
                style={{
                  fontSize: '16px',
                  marginVertical: '10px',
                  padding: '10px',
                  borderColor: 'gray',
                  borderWidth: '2px',
                  borderRadius: '5px',
                  width: '70%',
                }}
                onChange={(e) => setInputName(e.target.value)}
                value={inputName}
                placeholder="你的大名...？"
              />
            </div>
            <div style={{ flexDirection: 'row', marginTop: '10px' }}>
              <button
                style={{
                  marginRight: '20px',
                  padding: '10px 20px',
                  backgroundColor: selectedGender === '弟兄' ? '#ccc' : '#fff',
                  borderRadius: '5px',
                }}
                onClick={() => setSelectedGender('弟兄')}
              >
                弟兄
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedGender === '姊妹' ? '#ccc' : '#fff',
                  borderRadius: '5px',
                }}
                onClick={() => setSelectedGender('姊妹')}
              >
                姊妹
              </button>
            </div>
          </div>
        )}

        {props.dialogType === 'Del' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0' }}>
              Farewell, my love 🥲
            </h2>
            <Select
              options={memberNames.map((name) => ({ label: name, value: name }))}
              value={{ label: inputName, value: inputName }}
              onChange={(selectedItem) => setInputName(selectedItem.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button onClick={handleCancel} style={styles.button}>取消</button>
          <button
            onClick={handleConfirm}
            disabled={okButtonDisabled}
            style={{ ...styles.button, backgroundColor: okButtonDisabled ? '#ccc' : '#007BFF' }}
          >
            {props.dialogType === 'Add' ? '確認新增' : '確認刪除'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  button: {
    padding: '10px 20px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default EditMemberDialog;
